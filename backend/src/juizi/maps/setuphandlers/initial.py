"""Example pages for the development site: the two JET maps rebuilt in the
new block, a shaded-regions map and two contact pages (made-up details).
Run by the `initial` profile (scripts/create_site.py)."""

from juizi.maps import logger
from pathlib import Path
from plone import api
from Products.GenericSetup.tool import SetupTool

import json
import uuid


EXAMPLES = Path(__file__).parent / "examples.json"


def _blocks(example):
    title_id, text_id, map_id = (str(uuid.uuid4()) for _ in range(3))
    block = {"@type": "juiziMap", **example["block"]}
    return {
        title_id: {"@type": "title"},
        text_id: {
            "@type": "slate",
            "value": [{"type": "p", "children": [{"text": example["intro"]}]}],
            "plaintext": example["intro"],
        },
        map_id: block,
    }, {"items": [title_id, text_id, map_id]}


def create_example_content(portal_setup: SetupTool):
    portal = api.portal.get()
    examples = json.loads(EXAMPLES.read_text())
    folder = portal.get("maps")
    if folder is None:
        folder = api.content.create(
            container=portal,
            type="Document",
            id="maps",
            title="Map examples",
            description="Pages to try the map block on.",
            blocks={
                "t": {"@type": "title"},
                "l": {
                    "@type": "listing",
                    "variation": "summary",
                    "querystring": {
                        "query": [
                            {
                                "i": "path",
                                "o": "plone.app.querystring.operation.string.relativePath",
                                "v": ".",
                            }
                        ],
                        "sort_on": "getObjPositionInParent",
                    },
                },
            },
            blocks_layout={"items": ["t", "l"]},
        )
        _publish(folder)
    for ex in examples:
        if ex["id"] in folder:
            continue
        blocks, layout = _blocks(ex)
        page = api.content.create(
            container=folder,
            type="Document",
            id=ex["id"],
            title=ex["title"],
            description=ex["description"],
            blocks=blocks,
            blocks_layout=layout,
        )
        _publish(page)
        logger.info(f"Created example page {page.absolute_url_path()}")


def _publish(obj):
    try:
        api.content.transition(obj=obj, transition="publish")
    except Exception:  # noqa: BLE001 - no workflow, or already published
        pass
