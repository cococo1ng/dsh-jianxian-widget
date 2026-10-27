# vendor/

只给 `verify/web.html` 自测台用，**不进产物**。

| 文件 | 来源 | 许可 |
|---|---|---|
| `react.production.min.js` | https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js | MIT |
| `react-dom.production.min.js` | https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js | MIT |

正式产物（`dist/xjj.user.js`）走用户脚本的 `@require` 从 jsdelivr 取同样的版本，
所以仓库里不放第二份 139 KB 的拷贝进产物。
