import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

export default {
  input: "src/plugin.js",
  output: {
    file: "dist/plugin.js"
  },
  plugins: [
    resolve(),
    babel({
      presets: ["@babel/preset-react"],
      compact: false,
      babelHelpers: "bundled",
    }),
    commonjs({
      include: "node_modules/**"
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production")
    })
  ]
};
