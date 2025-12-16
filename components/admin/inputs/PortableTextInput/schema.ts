import { defineSchema } from "@portabletext/editor"

export const schemaDefinition = defineSchema({
  styles: [
    { name: "normal", title: "Normal" },
    { name: "h1", title: "Heading 1" },
    { name: "h2", title: "Heading 2" },
    { name: "h3", title: "Heading 3" },
    { name: "h4", title: "Heading 4" },
    { name: "blockquote", title: "Quote" }
  ],

  decorators: [
    { name: "strong", title: "Bold" },
    { name: "em", title: "Italic" },
    { name: "underline", title: "Underline" },
    { name: "strike-through", title: "Strikethrough" },
    { name: "code", title: "Code" }
  ],

  lists: [
    { name: "bullet", title: "Bullet List" },
    { name: "number", title: "Numbered List" }
  ],

  annotations: [
    {
      name: "link",
      title: "Link",
      fields: [
        {
          name: "href",
          title: "URL",
          type: "string"
        }
      ]
    }
  ],

  blockObjects: [
    {
      name: "image",
      title: "Image",
      fields: [
        {
          name: "asset",
          title: "Asset",
          type: "object"
        },
        {
          name: "caption",
          title: "Caption",
          type: "string"
        },
        {
          name: "alt",
          title: "Alt Text",
          type: "string"
        }
      ]
    }
  ],

  inlineObjects: []
})