from functools import lru_cache
from typing import List, Optional, Union

from flask import Flask, abort, current_app, jsonify, request, send_from_directory

from aqt.exceptions import ArchiveConnectionError, ArchiveDownloadError, CliInputError
from aqt.helper import Settings
from aqt.metadata import ArchiveId, MetadataFactory, SimpleSpec, ToolData, Version, Versions

app = Flask(__name__)  # , static_url_path="/static")
Settings.load_settings()


@lru_cache(maxsize=2048)
def get_qt_meta(
    archive_id: ArchiveId, mod_ver: Optional[str] = None, arch_ver: Optional[str] = None
) -> Union[List[str], Versions]:
    return MetadataFactory(archive_id, modules_ver=mod_ver, architectures_ver=arch_ver).getList()


@lru_cache(maxsize=400)
def get_tool_meta(archive_id, tool_name) -> Union[List[str], ToolData]:
    return MetadataFactory(archive_id, tool_name=tool_name, is_long_listing=True).getList()


def all_extensions(target: str, version: Version) -> List[str]:
    if target == "desktop" and (version in SimpleSpec(">=5.13,<6") or version in SimpleSpec(">=6.2")):
        return ["", "wasm"]
    elif target == "android" and version >= Version("6.0.0"):
        return ["x86", "x86_64", "armv7", "arm64_v8a"]
    return [""]


def ext_for_arch(target: str, version: Version, arch: str) -> str:
    if "wasm" in arch:
        return "wasm"
    elif target == "android" and version >= Version("6.0.0"):
        return arch[len("android_") :]
    return ""


@app.route("/list-qt/versions/<host>/<target>/")
def list_qt_versions(host: str, target: str):
    meta: Versions = get_qt_meta(ArchiveId("qt", host, target))
    return jsonify(versions=[[format(version) for version in row] for row in meta.versions])


@app.route("/list-qt/arch/<host>/<target>/<ver>/")
def list_qt_arches(host: str, target: str, ver: str):
    meta: List[str] = []
    for ext in all_extensions(target, Version(ver)):
        try:
            meta.extend(get_qt_meta(ArchiveId("qt", host, target, ext), arch_ver=ver))
        except CliInputError:
            pass
    return jsonify(architectures=meta)


@app.route("/list-qt/mod/<host>/<target>/<ver>/<arch>/")
def list_qt_modules(host: str, target: str, ver: str, arch: str):
    ext = ext_for_arch(target, Version(ver), arch)
    meta: List[str] = get_qt_meta(ArchiveId("qt", host, target, ext), mod_ver=ver)
    return jsonify(modules=meta)


def replaceNewlines(obj: any) -> any:
    if isinstance(obj, str):
        return obj.replace("\n", "<br>")
    return obj


@app.route("/list-tool/<host>/<target>/")
def list_tool(host, target):
    tool_name: Optional[str] = request.args.get("tool", None)
    meta = get_tool_meta(ArchiveId(category="tools", host=host, target=target), tool_name=tool_name)
    if isinstance(meta, Versions):
        abort(500)
    if tool_name:
        assert isinstance(meta, ToolData)
        return jsonify(
            tool_variants=[                # replace newlines with <br> tags
                {key: replaceNewlines(value) for key, value in item.items()}
                for tool_variant, item in meta.tool_data.items()
            ]
        )
    assert isinstance(meta, list)
    return jsonify(tools=meta)


@app.route("/")
def home():
    return current_app.send_static_file("index.html")


#
#
# @app.route("/bundle.js")
# def js():
#     return current_app.send_static_file("bundle.js")


@app.errorhandler(ValueError)
def handle_value_errors(e):
    return jsonify(err=f"Invalid parameter: {e}"), 400


@app.errorhandler(CliInputError)
def handle_cli_input_errors(e):
    return jsonify(err=f"Invalid parameter: {e}"), 400


@app.errorhandler(ArchiveDownloadError)
def handle_no_xml_file(e):
    return jsonify(err=format(e)), 502


@app.errorhandler(ArchiveConnectionError)
def handle_no_connection(e):
    return jsonify(err=format(e)), 502


if __name__ == "__main__":
    app.run()
