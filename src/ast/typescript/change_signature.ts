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
        // Check if newSignature includes function name (e.g., "hello(params): returnType")
        const fullMatch = newSignature.match(/^(\w+)\s*\((.*)\)\s*(:\s*.+)?$/);
        const paramsOnlyMatch = newSignature.match(/^\((.*)\)\s*(:\s*.+)?$/);
        
        let newFunctionName = "";
        let params = "";
        let type = "";
        
        if (fullMatch) {
          // Format: "functionName(params): returnType"
          newFunctionName = fullMatch[1];
          params = fullMatch[2];
          type = fullMatch[3] || "";
        } else if (paramsOnlyMatch) {
          // Format: "(params): returnType"
          params = paramsOnlyMatch[1];
          type = paramsOnlyMatch[2] || "";
        }
        
        // Change function name if specified
        if (newFunctionName && funcNode.getKind() === SyntaxKind.FunctionDeclaration) {
          (funcNode as FunctionDeclaration).rename(newFunctionName);
        } else if (newFunctionName && funcNode.getKind() === SyntaxKind.MethodDeclaration) {
          (funcNode as MethodDeclaration).rename(newFunctionName);
        }
        
        // Change parameters
        funcNode.getParameters().forEach(p => p.remove());
        params.split(",").map(s => s.trim()).filter(Boolean).forEach(param => {
          funcNode!.addParameter({
            name: param.split(":")[0].trim(),
            type: param.split(":")[1]?.trim() || undefined,
          });
        });
        
        // Change return type
        if (type) funcNode.setReturnType(type.replace(":", "").trim());
        
        changed = true;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`Error changing signature for function '${functionName}' in file '${sourceFile.getFilePath()}': ${errorMessage}`);
        // Continue processing other functions instead of failing completely
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
