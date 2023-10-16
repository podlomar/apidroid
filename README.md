# jsonhost

A simple HTTP server that serves JSON files from a directory. Useful for mocking APIs or educational purposes.

## Example usage

To serve the content of the current directory on port `4000`:

```bash
$ npx jsonhost
```

You can also specify a directory and port to serve on:

```bash
$ npx jsonhost ./data --port 4000
```

## Directory structure

The directory structure is used to determine the URL structure. For example, the following directory structure creates two collections:

```
data
├── users.json
└── posts
    └── items.json
```

This will create the following URL endpoints:

```
http://localhost:4000/users
http://localhost:4000/users/:id
http://localhost:4000/posts
http://localhost:4000/posts/:id
```

Each JSON file must contain and array of objects. The array will be served as the contents of the corresponding URL.

## CRUD operations

Along with serving the contents of the JSON files, the server also supports CRUD operations.

The following CRUD operations are supported:

| Method   | URL                   | Description                                                 |
| -------- | --------------------- | ----------------------------------------------------------- |
| `GET`    | `/api/collection`     | Returns the array of items inside JSON file.                |
| `POST`   | `/api/collection`     | Appends new item to the end of the JSON array.              |
| `PUT`    | `/api/collection/:id` | Replaces the contents of the an item with the request body. |
| `DELETE` | `/api/collection/:id` | Deletes an item from the JSON array.                        |
