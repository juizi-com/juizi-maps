# Shared block code (`_shared/`)

A copy of the parts of the Juizi block toolkit this add-on uses, taken from
[juizi-blocks](https://github.com/juizi-com/juizi-blocks) at commit
`f5e459f` (`frontend/packages/volto-juizi-blocks/src/components/Blocks/_shared/`
and `components/BlockEdit/BlockEdit.jsx`):

- `BlockPlaceholder` (+ `block-placeholder.css`): the start screen and empty
  states.
- `EditHint` (+ `edit-hint.css`): edit-only hints inside the block.
- `BlockErrorBoundary`: editors see a message, visitors see nothing.
- `BlockWrapper` (+ `__mocks__/` for Jest): the block's outer container.
- `editMode.js`: `isEditing(props)`.
- `messages.js`: only the message the error boundary needs, with the same id.
- `../BlockEdit/BlockEdit.jsx`: `makeBlockEdit` and `schemaData`.

juizi-blocks is the source of truth. The add-on doesn't depend on it, so a
site can have the chat bot without the whole Juizi block set. When the
toolkit changes there, copy the change here (or, once a third add-on needs
it, move the toolkit into a package of its own).
