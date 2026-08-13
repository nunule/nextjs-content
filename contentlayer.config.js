import { defineDocumentType, makeSource } from "contentlayer/source-files"

/** @type {import('contentlayer/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: "string",
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
  },
}

const chapterComputedFields = {
  novelSlug: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/")[1],
  },
  chapterSlug: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(3).join("/"),
  },
  slug: {
    type: "string",
    resolve: (doc) => {
      const parts = doc._raw.flattenedPath.split("/")
      return `/novels/${parts[1]}/chapters/${parts.slice(3).join("/")}`
    },
  },
}

export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `pages/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
  },
  computedFields,
}))

export const Novel = defineDocumentType(() => ({
  name: "Novel",
  filePathPattern: `novels/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    status: {
      type: "enum",
      options: ["连载中", "已完结"],
      required: true,
    },
  },
  computedFields,
}))

export const Chapter = defineDocumentType(() => ({
  name: "Chapter",
  filePathPattern: `novels/**/chapters/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    chapterNumber: {
      type: "number",
      required: true,
    },
  },
  computedFields: chapterComputedFields,
}))

export default makeSource({
  contentDirPath: "./content",
  contentDirExclude: ["posts"],
  documentTypes: [Novel, Chapter, Page],
})
