# apidroid

A simple HTTP server that serves JSON files from a directory. Useful for mocking APIs or educational purposes. You can also provide your own endpoint implementations with a simple JavaScript file.

## Outline

- [Example usage](#example-usage)
- [Directory structure](#directory-structure)
- [Assets](#assets)
- [CRUD operations](#crud-operations)
  - [POST method](#post-method)
  - [PUT method](#put-method)
  - [PATCH method](#patch-method)
  - [DELETE method](#delete-method)
- [Querying data](#querying-data)
  - [Filtering](#filtering)
  - [Selecting fields](#selecting-fields)
  - [Limits and offsets](#limits-and-offsets)
- [Custom endpoints](#custom-endpoints)

## Example usage

To serve the content of the current directory on port `4000`:

```bash
$ npx apidroid@latest
```

You can also specify a directory and port to serve on:

```bash
$ npx apidroid@latest ./data --port 4000
```

## Directory structure

The directory structure is used to determine the URL structure. For example, the following directory structure creates two endpoints with two data collections:

```
api
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

## Assets

You can also serve static assets by placing them in the `assets` directory. For example, if you have the following directory structure:

```
api
├── users.json
└── posts
    └── items.json
assets
└── images
    └── logo.png
```

You can access the logo image at:

```
http://localhost:4000/assets/images/logo.png
```

## CRUD operations

Along with serving the contents of the JSON files, the server also supports CRUD operations. The following CRUD operations are supported:

| Method   | URL                   | Description                                                 |
| -------- | --------------------- | ----------------------------------------------------------- |
| `GET`    | `/api/collection`     | Returns the array of items inside JSON file.                |
| `POST`   | `/api/collection`     | Appends new item to the end of the JSON array               |
| `PUT`    | `/api/collection/:id` | Replaces the contents of the an item with the request body. |
| `PATCH`  | `/api/collection/:id` | Updates the contents of an item with the request body.      |
| `DELETE` | `/api/collection/:id` | Deletes an item from the JSON array.                        |

### POST method

The POST method expects a JSON object in the request body. The object will be appended to the end of the collection with a new ID. The endpoint will return the ID of the newly created item.

### PUT method

The PUT method expects a JSON object in the request body. The object will replace the item with the specified ID. 

You cannot use PUT to create new items. If the item with the specified ID does not exist, the endpoint will return a 404 error. For creating new items, use the POST method instead.

### PATCH method

The PATCH method expects a [JSON Patch](https://jsonpatch.com/) object in the request body. The patch object will be applied to the item with the specified ID.

### DELETE method

The DELETE method deletes the item with the specified ID.

## Querying data

You can query data returned by the GET method by adding query parameters to the URL. 

### Filtering

To get all users with the name "John":

```
http://localhost:4000/users?filter=name:eq:John
```

The query parameters are in the format `key:operator:value`. The following operators are supported:

| Operator | Description                                   |
| -------- | --------------------------------------------  |
| `eq`     | equal to the specified value.                 |
| `neq`    | not equal to the specified value.             |
| `gt`     | greater than the specified value.             |
| `gte`    | greater than or equal to the specified value. |
| `lt`     | less than the specified value.                |
| `lte`    | less than or equal to the specified value.    |
| `sub`    | contains the specified value as substring     |

You can combine multiple filter clauses by the AND operator by separating them with a comma. For example, to get all users with the name "John" and age greater than 20:

```
http://localhost:4000/users?filter=name:eg:John,age:gt:20
```

If you want to combine multiple filter clauses with the OR operator, you can use the `filter` query parameter multiple times. For example, to get all users with the name "John" or "Jane":

```
http://localhost:4000/users?filter=name:eg:John&filter=name:eg:Jane
```

### Selecting fields

To select only specific fields, you can use the `select` query parameter. For example, to get only the name and age of all users:

```
http://localhost:4000/users?select=name,age
```

### Limits and offsets

To limit the number of items returned, you can use the `limit` query parameter. For example, to get only the first 10 users:

```
http://localhost:4000/users?limit=10
```

To skip the first `n` items, you can use the `offset` query parameter. For example, to get the 11th to 20th users:

```
http://localhost:4000/users?offset=10&limit=10
```

## Custom endpoints

You can also create custom endpoints by placing JavaScript files in the endpoint directory. For example, if you have the following directory structure:

```
api
└── custom.js
```

You can access the endpoint as usual at:

```
http://localhost:4000/api/custom
```

The JavaScript file must be an ES module with default export of an Express router. For example:
 
```js
import express from 'express';

const router = express.Router();
router.get('/', (req, res) => {
  res.send('Hello world');
});

export default router;
```

You can also define custom endpoints in directories using the `route.js` file:

```
api
└── custom
    └── route.js
```
