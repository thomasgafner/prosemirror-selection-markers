const {schema} = require("prosemirror-schema-basic")
const {Schema} = require("prosemirror-model")
const {Selection, TextSelection, NodeSelection} = require("prosemirror-state")
const {addSelectionMarkersNodes} = require("..")
const {builders} = require("prosemirror-test-builder")

const testSchema = new Schema({
  nodes: addSelectionMarkersNodes(schema.spec.nodes, "inline"),
  marks: schema.spec.marks
})

const out = builders(testSchema, {
  p: {nodeType: "paragraph"},
  // pre: {nodeType: "code_block"},
  h1: {nodeType: "heading", level: 1},
  h2: {nodeType: "heading", level: 2},
  h3: {nodeType: "heading", level: 3},
  // li: {nodeType: "list_item"},
  // ul: {nodeType: "bullet_list"},
  // ol: {nodeType: "ordered_list"},
  br: {nodeType: "hard_break"},
	anchor: {nodeType: "anchor_marker"},
	head: {nodeType: "head_marker"},
  // img: {nodeType: "image", src: "img.png"},
  hr: {nodeType: "horizontal_rule"},
  a: {markType: "link", href: "foo"},
})

out.selFor = function(doc) {
	let a = doc.tag.a
	if (a != null) {
		let $a = doc.resolve(a)
		if ($a.parent.inlineContent) return new TextSelection($a, doc.tag.b != null ? doc.resolve(doc.tag.b) : undefined)
		else return new NodeSelection($a)
	}
	return Selection.atStart(doc)
}

out.eq = function eq(a, b) { return a.eq(b) }
out.builders = builders

module.exports = out
