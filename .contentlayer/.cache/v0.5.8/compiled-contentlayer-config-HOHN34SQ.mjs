// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
var Doc = defineDocumentType(() => ({
  name: "Doc",
  filePathPattern: "docs/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true
    },
    description: {
      type: "string",
      required: false
    },
    category: {
      type: "string",
      required: false
    },
    order: {
      type: "number",
      required: false
    }
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace("docs/", "")
    },
    url: {
      type: "string",
      resolve: (doc) => `/docs/${doc._raw.flattenedPath.replace("docs/", "")}`
    }
  }
}));
var Blog = defineDocumentType(() => ({
  name: "Blog",
  filePathPattern: "blog/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true
    },
    excerpt: {
      type: "string",
      required: true
    },
    publishedAt: {
      type: "date",
      required: true
    },
    author: {
      type: "string",
      required: false,
      default: "Renderiq Team"
    },
    authorName: {
      type: "string",
      required: false,
      default: "Renderiq Team"
    },
    authorBio: {
      type: "string",
      required: false
    },
    authorImage: {
      type: "string",
      required: false
    },
    coverImage: {
      type: "string",
      required: false
    },
    image: {
      type: "string",
      required: false
    },
    tags: {
      type: "list",
      of: { type: "string" },
      required: false
    },
    keywords: {
      type: "list",
      of: { type: "string" },
      required: false
    },
    seoTitle: {
      type: "string",
      required: false
    },
    seoDescription: {
      type: "string",
      required: false
    },
    featured: {
      type: "boolean",
      required: false,
      default: false
    },
    readingTime: {
      type: "number",
      required: false
    },
    category: {
      type: "string",
      required: false
    },
    collection: {
      type: "string",
      required: false
    }
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace("blog/", "")
    },
    url: {
      type: "string",
      resolve: (doc) => `/blog/${doc._raw.flattenedPath.replace("blog/", "")}`
    }
  }
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content",
  documentTypes: [Doc, Blog],
  disableImportAliasWarning: true,
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["anchor"]
          }
        }
      ],
      [
        rehypePrettyCode,
        {
          theme: "github-dark",
          onVisitLine(node) {
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
          }
        }
      ]
    ]
  }
});
export {
  Blog,
  Doc,
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-HOHN34SQ.mjs.map
