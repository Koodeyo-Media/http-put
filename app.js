const Express = require("express");
const app = Express();
const fs = require("fs-extra");
const path = require("path");
const logger = require("morgan");
const rootDir = path.join(__dirname, "www");
const PORT = process.env.PORT || 4001;

app.use(logger("dev"));

app.all("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT,DELETE,GET");
  next();
});

app.use(Express.static(rootDir));

app
  .route("*")
  .put((req, res) => {
    let absolutePath = path.join(rootDir, req.path);
    let splitted = absolutePath.split("/");
    splitted.pop();
    let rootPath = splitted.join("/");

    if (!fs.existsSync(rootPath)) fs.mkdirSync(rootPath, { recursive: true });
    const stream = fs.createWriteStream(absolutePath);
    const upload = req.pipe(stream);

    upload.on("finish", function () {
      res.end();
    });
  })
  .delete(async (req, res) => {
    let absolutePath = path.join(rootDir, req.path);

    if (req.query.recursive) {
      async function recursiveRm(pathname) {
        try {
          let st = await fs.promises.stat(pathname);
          if (st.isDirectory()) {
            let names = await fs.promises.readdir(pathname);
            for (let name of names) {
              await recursiveRm(path.join(pathname, name));
            }
            await fs.promises.rmdir(pathname);
          } else {
            await fs.promises.unlink(pathname);
          }
        } catch (e) {}
      }

      await recursiveRm(absolutePath);
    } else {
      let st = await fs.promises.stat(absolutePath);
      if (!st.isFile())
        return res
          .status(400)
          .send("Cannot delete a folder unless --recursive is specified");
      await fs.promises.unlink(absolutePath);
    }

    res.end();
  });

app.listen(PORT, function () {
  console.log(`Http put is listening on port ${PORT}`);
});
