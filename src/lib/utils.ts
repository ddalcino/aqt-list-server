export type Host = "windows" | "mac" | "linux";
export type Target = "desktop" | "android" | "ios" | "winrt";

export const hosts: Readonly<Host[]> = ["windows", "mac", "linux"];
const targetsForHost = (host: Host): Target[] => {
  switch (host) {
    case "linux":
      return ["desktop", "android"];
    case "mac":
      return ["desktop", "android", "ios"];
    case "windows":
      return ["desktop", "android", "winrt"];
  }
};

const hostOs = (): Host => {
  const app_ver = navigator.appVersion;
  if (app_ver.indexOf("Win") !== -1) return "windows";
  if (app_ver.indexOf("Mac") !== -1) return "mac";
  return "linux";
};

export const get_host_target_targets = (
  host?: Host,
  target?: Target
): [Host, Target, Target[]] => {
  const host_os: Host = host && hosts.includes(host) ? host : hostOs();
  const targets = targetsForHost(host_os);
  const target_sdk = target && targets.includes(target) ? target : "desktop";
  return [host_os, target_sdk, targets];
};

export const copyText = async (el: HTMLElement): Promise<void> => {
  await navigator.clipboard.writeText(el.textContent as string);
};
