# jsonhost

A simple HTTP server that serves JSON files from a directory. Useful for mocking APIs or educational purposes.

## Example usage

To serve the contents of the `./data` directory on port `4000`:

```bash
$ npx jsonhost ./data --port 4000
```

## Directory structure

The directory structure is used to determine the URL structure. For example, the following directory structure:

```
data
├── users.json
└── posts
    └── items.json
```

Will result in the following URLs:

```
http://localhost:4000/users
http://localhost:4000/posts
```

Each JSON file must contain and array of objects. The array will be served as the contents of the corresponding URL.

## CRUD operations

The following CRUD operations are supported:

| Method | Description |
| --- | --- |
| `GET` | Returns the array of items inside JSON file. |
| `POST` | Appends new item to the end of the JSON array. |
| `PUT` | Replaces the contents of the an item with the request body. |
| `DELETE` | Deletes an item from the JSON array. |
