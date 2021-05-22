const {EditorState} = require("prosemirror-state")
const {Fragment} = require("prosemirror-model")
const ist = require("ist")
const {selFor, eq, anchor, head, doc, p, h1} = require("./builder")
const {replaceWithAndSetSelection} = require("..")

// :: (Node, Fragment|Node|[Node], Node)
function apply(doc, fragment, result) {
	let state = EditorState.create({doc, selection: selFor(doc)})
	const from = doc.tag.p
	const to = doc.tag.q
	let tr = state.tr // start a transaction
	tr = replaceWithAndSetSelection(tr, fragment, from, to)
	ist(tr.doc, result || doc, eq)
	if (result && result.tag.a != null) ist(tr.selection, selFor(result), eq)
}

describe("replaceWithAndSetSelection", () => {
	// The source doc has always the default selection at start. (head() instead of <a>)

	it("replaces fragment and sets selection according to head and anchor nodes", () =>
		apply(
			doc(p("ABCD"),"<p>",p("EF",anchor(),"GH"),p("IJKL"),p("MN",head(),"OP"),"<q>",p("QRST")),
			Fragment.from(
				[h1("EF",anchor(),"GH"),p("MN",head(),"OP")]
			),
			doc(p("ABCD"),h1("EF<a>GH"),p("MN<b>OP"),p("QRST"))
		)
	)

	it("replaces fragment and sets selection also if reversed", () =>
		apply(
			doc(p("ABCD"),"<p>",p("EF",head(),"GH"),p("IJKL"),p("MN",anchor(),"OP"),"<q>",p("QRST")),
			Fragment.from(
				[h1("EF",head(),"GH"),p("MN",anchor(),"OP")]
			),
			doc(p("ABCD"),h1("EF<b>GH"),p("MN<a>OP"),p("QRST"))
		)
	)

	it("replaces fragment and sets cursor according to head node", () =>
		apply(
			doc(p("ABCD"),"<p>",p("EF",head(),"GH"),"<q>",p("IJKL")),
			Fragment.from(h1("EF",head(),"GH")),
			doc(p("ABCD"),h1("EF<b>GH"),p("IJKL"))
		)
	)

	// some more pathological cases (but they may happen)

	// TODO activate if fixed
	// it("replaces fragment and sets selection even if there are multiple head and anchor nodes (first one wins)", () =>
	// 	apply(
	// 		doc(p("ABCD"),"<p>",p("EF",anchor(),"GH"),p("IJKL"),p("MN",head(),"OP"),"<q>",p("QRST")),
	// 		Fragment.from(
	// 			[h1("EF",anchor(),"GH"),p("EF",anchor(),"GH"),h1("MN",head(),"OP"),p("MN",head(),"OP")]
	// 		),
	// 		doc(p("ABCD"),h1("EF<a>GH"),p("EFGH"),h1("MN<b>OP"),p("MNOP"),p("QRST"))
	// 	)
	// )

})
