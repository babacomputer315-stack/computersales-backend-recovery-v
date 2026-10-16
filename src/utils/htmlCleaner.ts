import sanitizeHtml from "sanitize-html";

export const cleanHtml = (html: string) => {
  let sanitizedHtml = html.replace(/<p><\/p>/g, "<br/>");
  return sanitizeHtml(sanitizedHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "figure",
      "figcaption",
      "p",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "br",
    ]),
    allowedAttributes: { a: ["href"], img: ["src", "alt"] },
    allowedSchemes: ["http", "https", "data"],
    allowedStyles: {},
    disallowedTagsMode: "discard",
  });
};
