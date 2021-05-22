const ist = require("ist")
const {selFor, eq, anchor, head, doc, p, h1} = require("./builder")
const {insertSelectionMarkers} = require("..")

function apply(doc, result) {
	const selection = selFor(doc);
	const res = insertSelectionMarkers(doc, selection);
	ist(res.doc, result || doc, eq)
	if (result && result.tag.a != null)
		ist(res.selection, selFor(result), eq)
}

describe("insertSelectionMarkers", () => {

	it("adds only head as a marker to the document if the selection is a cursor", () =>
			apply(
				doc(p("123<a>456")),
				doc(p("123", head(), "456")
			)
		)
	)

	// There is no case with no selection. There is at least a cursor at the beginning.

	it("adds head and anchor as markers to the document if the selection is expanded", () =>
			apply(
				doc(p("12<a>34<b>56")),
				doc(p("12", anchor(), "34", head(), "56")
			)
		)
	)

	it("adds head and anchor as markers even if the document is more complex", () =>
			apply(
				doc(h1("One"),p("12<a>3"),p("456"),h1("T<b>wo"),p("789")),
				doc(h1("One"),p("12",anchor(),"3"),p("456"),h1("T",head(),"wo"),p("789")
			)
		)
	)

	it("adds head and anchor as markers to the document even if the selection reversed", () =>
			apply(
				doc(p("12<b>34<a>56")),
				doc(p("12", head(), "34", anchor(), "56")
			)
		)
	)

})
