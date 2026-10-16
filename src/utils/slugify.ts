export const slugify = (text: string) => {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/-+/g, "-");
};
