/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

// Visit ES6 ESTree compatible AST nodes in program order.
// <https://github.com/estree/estree>.
//
// The Node types and properties (for ES6) are described in:
// <https://github.com/estree/estree/blob/master/es6.md>
//
// The ESTree spec doesn't appear to be complete yet, so this
// currently assumes some Esprima nodes and properties.
// <http://esprima.org/demo/parse.html>

// FIXME: Add support for Import/Export/Modules nodes if we allow parsing modules.

ESTreeWalker = class ESTreeWalker
{
    constructor(before, after)
    {
        console.assert(typeof before === "function");
        console.assert(typeof after === "function");

        this._before = before;
        this._after = after;
    }

    walk(node)
    {
        this._walk(node, null);
    }

    // Private

    _walk(node, parent)
    {
        if (!node)
            return;

        node.parent = parent;

        this._before(node);
        this._walkChildren(node);
        this._after(node);
    }

    _walkArray(array, parent)
    {
        if (!array)
            return;

        for (let i = 0; i < array.length; ++i)
            this._walk(array[i], parent);
    }

    _walkChildren(node)
    {
        switch (node.type) {
        case "AssignmentExpression":
            this._walk(node.left, node);
            this._walk(node.right, node);
            break;
        case "ArrayExpression":
        case "ArrayPattern":
            this._walkArray(node.elements, node);
            break;
        case "AssignmentPattern":
            this._walk(node.left, node);
            this._walk(node.right, node);
            break;
        case "AwaitExpression":
            this._walk(node.argument, node);
            break;
        case "BlockStatement":
        case "StaticBlock":
            this._walkArray(node.body, node);
            break;
        case "BinaryExpression":
            this._walk(node.left, node);
            this._walk(node.right, node);
            break;
        case "BreakStatement":
        case "ContinueStatement":
            this._walk(node.label, node);
            break;
        case "CallExpression":
            this._walk(node.callee, node);
            this._walkArray(node.arguments, node);
            break;
        case "CatchClause":
            this._walk(node.param, node);
            this._walk(node.body, node);
            break;
        case "ChainExpression":
            this._walk(node.expression);
            break;
        case "ClassBody":
            this._walkArray(node.body, node);
            break;
        case "ClassDeclaration":
        case "ClassExpression":
            this._walk(node.id, node);
            this._walk(node.superClass, node);
            this._walk(node.body, node);
            break;
        case "DoWhileStatement":
            this._walk(node.body, node);
            this._walk(node.test, node);
            break;
        case "ExpressionStatement":
            this._walk(node.expression, node);
            break;
        case "ForStatement":
            this._walk(node.init, node);
            this._walk(node.test, node);
            this._walk(node.update, node);
            this._walk(node.body, node);
            break;
        case "ForInStatement":
        case "ForOfStatement":
            this._walk(node.left, node);
            this._walk(node.right, node);
            this._walk(node.body, node);
            break;
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "ArrowFunctionExpression":
            this._walk(node.id, node);
            this._walkArray(node.params, node);
            this._walk(node.body, node);
            break;
        case "IfStatement":
            this._walk(node.test, node);
            this._walk(node.consequent, node);
            this._walk(node.alternate, node);
            break;
        case "LabeledStatement":
            this._walk(node.label, node);
            this._walk(node.body, node);
            break;
        case "LogicalExpression":
            this._walk(node.left, node);
            this._walk(node.right, node);
            break;
        case "MemberExpression":
            this._walk(node.object, node);
            this._walk(node.property, node);
            break;
        case "MethodDefinition":
            this._walk(node.key, node);
            this._walk(node.value, node);
            break;
        case "NewExpression":
            this._walk(node.callee, node);
            this._walkArray(node.arguments, node);
            break;
        case "ObjectExpression":
        case "ObjectPattern":
            this._walkArray(node.properties, node);
            break;
        case "Program":
            this._walkArray(node.body, node);
            break;
        case "Property":
            this._walk(node.key, node);
            this._walk(node.value, node);
            break;
        case "RestElement":
            this._walk(node.argument, node);
            break;
        case "ReturnStatement":
            this._walk(node.argument, node);
            break;
        case "SequenceExpression":
            this._walkArray(node.expressions, node);
            break;
        case "SpreadElement":
            this._walk(node.argument, node);
            break;
        case "SwitchStatement":
            this._walk(node.discriminant, node);
            this._walkArray(node.cases, node);
            break;
        case "SwitchCase":
            this._walk(node.test, node);
            this._walkArray(node.consequent, node);
            break;
        case "ConditionalExpression":
            this._walk(node.test, node);
            this._walk(node.consequent, node);
            this._walk(node.alternate, node);
            break;
        case "TaggedTemplateExpression":
            this._walk(node.tag, node);
            this._walk(node.quasi, node);
            break;
        case "ThrowStatement":
            this._walk(node.argument, node);
            break;
        case "TryStatement":
            this._walk(node.block, node);
            this._walk(node.handler, node);
            this._walk(node.finalizer, node);
            break;
        case "UnaryExpression":
            this._walk(node.argument, node);
            break;
        case "UpdateExpression":
            this._walk(node.argument, node);
            break;
        case "VariableDeclaration":
            this._walkArray(node.declarations, node);
            break;
        case "VariableDeclarator":
            this._walk(node.id, node);
            this._walk(node.init, node);
            break;
        case "WhileStatement":
            this._walk(node.test, node);
            this._walk(node.body, node);
            break;
        case "WithStatement":
            this._walk(node.object, node);
            this._walk(node.body, node);
            break;
        case "YieldExpression":
            this._walk(node.argument, node);
            break;

        case "ExportAllDeclaration":
            this._walk(node.source, node);
            this._walkArray(node.assertions, node);
            break;
        case "ExportNamedDeclaration":
            this._walk(node.declaration, node);
            this._walkArray(node.specifiers, node);
            this._walk(node.source, node);
            this._walkArray(node.assertions, node);
            break;
        case "ExportDefaultDeclaration":
            this._walk(node.declaration, node);
            break;
        case "ExportSpecifier":
            this._walk(node.local, node);
            this._walk(node.exported, node);
            break;
        case "ImportAttribute":
            this._walk(node.key, node);
            this._walk(node.value, node);
            break;
        case "ImportDeclaration":
            this._walkArray(node.specifiers, node);
            this._walk(node.source, node);
            this._walkArray(node.assertions, node);
            break;
        case "ImportDefaultSpecifier":
            this._walk(node.local, node);
            break;
        case "ImportExpression":
            this._walk(node.source, node);
            this._walk(node.attributes, node);
            break;
        case "ImportNamespaceSpecifier":
            this._walk(node.local, node);
            break;
        case "ImportSpecifier":
            this._walk(node.imported, node);
            this._walk(node.local, node);
            break;
        case "MetaProperty":
            this._walk(node.meta, node);
            this._walk(node.property, node);
            break;

        // Special case. We want to walk in program order,
        // so walk quasi, expression, quasi, expression, etc.
        case "TemplateLiteral":
            for (var i = 0; i < node.expressions.length; ++i) {
                this._walk(node.quasis[i], node);
                this._walk(node.expressions[i], node);
            }
            break;

        // Leaf nodes.
        case "DebuggerStatement":
        case "EmptyStatement":
        case "Identifier":
        case "PrivateIdentifier":
        case "Literal":
        case "Super":
        case "ThisExpression":
        case "TemplateElement":
            break;

        default:
            console.error("ESTreeWalker unhandled node type", node.type);
            break;
        }
    }
};
