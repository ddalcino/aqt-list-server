import json
import logging
import posixpath
from datetime import datetime
from pathlib import Path
from typing import Dict, Generator, Optional, Tuple

import aqt.metadata
import bs4
from aqt.helper import Settings, ssplit
from aqt.metadata import ArchiveId
from defusedxml import ElementTree

fetch_http = aqt.metadata.MetadataFactory.fetch_http
IGNORED_FOLDERS = ("Parent Directory", "extras_src")  # "preview_main_node", "licenses")
logging.basicConfig()
LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)


def banner_message(msg: str):
    msg = f"* {msg} *"
    stars = "*" * len(msg)
    return f"\n{stars}\n{msg}\n{stars}"


def iterate_hosts_targets() -> Generator[Tuple[str, str], None, None]:
    for host in ArchiveId.HOSTS:
        for target in ArchiveId.TARGETS_FOR_HOST[host]:
            yield host, target


def iterate_folders(
    html_doc: str, filter_category: str = ""
) -> Generator[Tuple[str, datetime], None, None]:
    def table_row_to_folder(tr: bs4.element.Tag) -> Optional[Tuple[str, datetime]]:
        try:
            folder: str = tr.find_all("td")[1].a.contents[0].rstrip("/")
            date_str = tr.find_all("td")[2].contents[0].rstrip()
            dt = datetime.strptime(date_str, "%d-%b-%Y %H:%M")
            return folder, dt
        except (AttributeError, IndexError, ValueError):
            return None

    soup: bs4.BeautifulSoup = bs4.BeautifulSoup(html_doc, "html.parser")
    for row in soup.body.table.find_all("tr"):
        content: Optional[Tuple[str, datetime]] = table_row_to_folder(row)
        if not content:
            continue
        folder = content[0]
        if (
            folder not in IGNORED_FOLDERS
            and "backup" not in folder
            and folder.startswith(filter_category)
        ):
            yield content


def is_recently_updated(date: datetime, date_of_last_update: datetime) -> bool:
    return date > date_of_last_update


def save_date_of_last_update(time_last_update: datetime):
    json_file = Path(__file__).parent.parent / "public/cache/last_updated.json"
    if not json_file.parent.is_dir():
        json_file.parent.mkdir(parents=True)
    json_file.write_text(
        json.dumps({"date_of_last_update": time_last_update.timestamp()})
    )


def get_date_of_last_update():
    json_file = Path(__file__).parent.parent / "public/cache/last_updated.json"
    timestamp = json.loads(json_file.read_text())["date_of_last_update"]
    return datetime.fromtimestamp(timestamp)


def xml_to_modules(xml_text: str) -> Dict[str, Dict[str, str]]:
    """Converts an XML document to a dict of `PackageUpdate` dicts, indexed by `Name` attribute.
    Only report elements that satisfy `predicate(element)`.
    Reports all keys available in the PackageUpdate tag as strings.

    :param xml_text: The entire contents of an xml file
    """
    try:
        parsed_xml = ElementTree.fromstring(xml_text)
    except ElementTree.ParseError as perror:
        raise RuntimeError(f"Downloaded metadata is corrupted. {perror}") from perror
    packages = {}
    for packageupdate in parsed_xml.iter("PackageUpdate"):
        downloads = packageupdate.find("DownloadableArchives")
        update_file = packageupdate.find("UpdateFile")
        if downloads is None or update_file is None or not downloads.text:
            continue
        name = packageupdate.find("Name").text
        packages[name] = {}
        for key in ["Name", "DisplayName", "Description", "Version", "ReleaseDate"]:
            packages[name][key] = packageupdate.find(key).text
        packages[name]["CompressedSize"] = human_readable_amt(
            int(update_file.attrib["CompressedSize"])
        )
        packages[name]["UncompressedSize"] = human_readable_amt(
            int(update_file.attrib["UncompressedSize"])
        )
        packages[name]["DownloadableArchives"] = [s for s in ssplit(downloads.text)]
    return packages


def update_xml_files():
    last_update: datetime = get_date_of_last_update()
    most_recent = last_update
    cache_root = Path(__file__).parent.parent / "public/cache"
    for host, target in iterate_hosts_targets():
        print(banner_message(f"Entering {host}/{target}"))
        dir_file = cache_root / host / target / "directory.json"
        if not dir_file.parent.is_dir():
            dir_file.parent.mkdir(parents=True)
        directory = json.loads(dir_file.read_text()) if dir_file.exists() else {}
        tools = set(directory.get("tools", []))
        qts = set(directory.get("qt", []))
        # Download html file:
        html_path = ArchiveId("qt", host, target).to_url()
        for folder, date in iterate_folders(fetch_http(html_path)):
            if date <= last_update:
                continue
            LOGGER.info(f"Update for {html_path}{folder}")
            # Download the xml file
            url = posixpath.join(html_path, folder, "Updates.xml")
            xml_data = fetch_http(url)
            content = xml_to_modules(xml_data)
            if not content:
                continue
            json_file = cache_root / host / target / f"{folder}.json"
            json_file.write_text(json.dumps(content))
            if date > most_recent:
                most_recent = date
            (tools if folder.startswith("tools") else qts).add(folder)
        dir_file.write_text(json.dumps({"tools": sorted(tools), "qt": sorted(qts)}))
    save_date_of_last_update(most_recent)


def human_readable_amt(num_bytes: int) -> str:
    size = num_bytes
    for label in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024:
            return f"{size:.3f}{label}"
        size = size / 1024
    return f"{size:.3f}PB"


if __name__ == "__main__":
    Settings.load_settings()
    update_xml_files()

