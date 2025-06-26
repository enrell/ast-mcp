import { Project, SyntaxKind, FunctionDeclaration, MethodDeclaration, FunctionExpression } from "ts-morph";
import * as path from "path";

// Args: <projectRoot> <functionName> <newSignature>
const [,, projectRoot, functionName, newSignature] = process.argv;

if (!projectRoot || !functionName || !newSignature) {
  console.error("Usage: node change_signature.js <projectRoot> <functionName> <newSignature>");
  process.exit(1);
}

const project = new Project({
  tsConfigFilePath: path.join(projectRoot, "tsconfig.json"),
});

let changedFiles: string[] = [];

project.getSourceFiles().forEach(sourceFile => {
  let changed = false;
  sourceFile.forEachDescendant(node => {
    let isTarget = false;
    let funcNode: FunctionDeclaration | MethodDeclaration | FunctionExpression | undefined = undefined;
    if (node.getKind() === SyntaxKind.FunctionDeclaration && (node as FunctionDeclaration).getName() === functionName) {
      isTarget = true;
      funcNode = node as FunctionDeclaration;
    } else if (node.getKind() === SyntaxKind.MethodDeclaration && (node as MethodDeclaration).getName() === functionName) {
      isTarget = true;
      funcNode = node as MethodDeclaration;
    } else if (node.getKind() === SyntaxKind.FunctionExpression) {
      // For function expressions, try to get the variable name
      const parent = node.getParent();
      if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
        const varName = parent.getFirstChildByKind(SyntaxKind.Identifier)?.getText();
        if (varName === functionName) {
          isTarget = true;
          funcNode = node as FunctionExpression;
        }
      }
    }
    if (isTarget && funcNode) {
      try {
        const match = newSignature.match(/^\((.*)\)\s*(:\s*.+)?$/);
        if (match) {
          const params = match[1];
          const type = match[2] || "";
          funcNode.getParameters().forEach(p => p.remove());
          params.split(",").map(s => s.trim()).filter(Boolean).forEach(param => {
            funcNode!.addParameter({
              name: param.split(":")[0].trim(),
              type: param.split(":")[1]?.trim() || undefined,
            });
          });
          if (type) funcNode.setReturnType(type.replace(":", "").trim());
          changed = true;
        }
      } catch (e) {
        // ignore
      }
    }
  });
  if (changed) {
    sourceFile.saveSync();
    changedFiles.push(sourceFile.getFilePath());
  }
});

console.log(JSON.stringify({
  changedFiles,
  message: changedFiles.length ? `Signature changed in ${changedFiles.length} file(s).` : "No function found."
}));
