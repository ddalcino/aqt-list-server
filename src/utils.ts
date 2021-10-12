export const hostOs = (): string => {
  const app_ver = navigator.appVersion;
  if (app_ver.indexOf("Win") !== -1) return "windows";
  if (app_ver.indexOf("Mac") !== -1) return "mac";
  return "linux";
};

export const copyText = async (el: HTMLElement): Promise<void> => {
  await navigator.clipboard.writeText(el.textContent as string);
};
