# Contracts

These files are the shared agreement between data, backend, and frontend branches.

- `contact.schema.json` defines the emergency service record shape.
- `api.examples.json` gives request and response examples for the first API version.

## Freeze status

Both files are frozen as of Merge 1. The Suyash and Sidhesh branches may implement against these contracts without modification.

Any branch that changes these files must:
1. Label the PR `contract-change`.
2. List the changed field or endpoint in the PR description.
3. Note which other branches need to react to the change.
4. Get acknowledgement from all teammates before merge.

