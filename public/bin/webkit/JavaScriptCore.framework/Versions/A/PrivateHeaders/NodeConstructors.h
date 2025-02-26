/*
 *  Copyright (C) 2009-2023 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Library General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Library General Public License for more details.
 *
 *  You should have received a copy of the GNU Library General Public License
 *  along with this library; see the file COPYING.LIB.  If not, write to
 *  the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 *  Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "Nodes.h"
#include "Opcode.h"

namespace JSC {

    inline void* ParserArenaFreeable::operator new(size_t size, ParserArena& parserArena)
    {
        return parserArena.allocateFreeable(size);
    }

    template<typename T>
    inline void* ParserArenaDeletable::operator new(size_t size, ParserArena& parserArena)
    {
        return parserArena.allocateDeletable<T>(size);
    }

    inline ParserArenaRoot::ParserArenaRoot(ParserArena& parserArena)
    {
        m_arena.swap(parserArena);
    }

    inline Node::Node(const JSTokenLocation& location)
        : m_position(location.line, location.startOffset, location.lineStartOffset)
    {
        ASSERT(location.startOffset >= location.lineStartOffset);
    }

    inline ExpressionNode::ExpressionNode(const JSTokenLocation& location, ResultType resultType)
        : Node(location)
        , m_resultType(resultType)
    {
    }

    inline StatementNode::StatementNode(const JSTokenLocation& location)
        : Node(location)
    {
    }

    inline ConstantNode::ConstantNode(const JSTokenLocation& location, ResultType resultType)
        : ExpressionNode(location, resultType)
    {
    }

    inline NullNode::NullNode(const JSTokenLocation& location)
        : ConstantNode(location, ResultType::nullType())
    {
    }

    inline BooleanNode::BooleanNode(const JSTokenLocation& location, bool value)
        : ConstantNode(location, ResultType::booleanType())
        , m_value(value)
    {
    }

    inline NumberNode::NumberNode(const JSTokenLocation& location, double value)
        : ConstantNode(location, JSValue(value).isInt32() ? ResultType::numberTypeIsInt32() : ResultType::numberType())
        , m_value(value)
    {
    }

    inline DoubleNode::DoubleNode(const JSTokenLocation& location, double value)
        : NumberNode(location, value)
    {
    }

    inline IntegerNode::IntegerNode(const JSTokenLocation& location, double value)
        : DoubleNode(location, value)
    {
    }

    inline BigIntNode::BigIntNode(const JSTokenLocation& location, const Identifier& value, uint8_t radix)
        : ConstantNode(location, ResultType::bigIntType())
        , m_value(value)
        , m_radix(radix)
        , m_sign(false)
    {
    }
    
    inline BigIntNode::BigIntNode(const JSTokenLocation& location, const Identifier& value, uint8_t radix, bool sign)
        : ConstantNode(location, ResultType::bigIntType())
        , m_value(value)
        , m_radix(radix)
        , m_sign(sign)
    {
    }

    inline StringNode::StringNode(const JSTokenLocation& location, const Identifier& value)
        : ConstantNode(location, ResultType::stringType())
        , m_value(value)
    {
    }

    inline TemplateExpressionListNode::TemplateExpressionListNode(ExpressionNode* node)
        : m_node(node)
    {
    }

    inline TemplateExpressionListNode::TemplateExpressionListNode(TemplateExpressionListNode* previous, ExpressionNode* node)
        : m_node(node)
    {
        previous->m_next = this;
    }

    inline TemplateStringNode::TemplateStringNode(const JSTokenLocation& location, const Identifier* cooked, const Identifier* raw)
        : ExpressionNode(location)
        , m_cooked(cooked)
        , m_raw(raw)
    {
    }

    inline TemplateStringListNode::TemplateStringListNode(TemplateStringNode* node)
        : m_node(node)
    {
    }

    inline TemplateStringListNode::TemplateStringListNode(TemplateStringListNode* previous, TemplateStringNode* node)
        : m_node(node)
    {
        previous->m_next = this;
    }

    inline TemplateLiteralNode::TemplateLiteralNode(const JSTokenLocation& location, TemplateStringListNode* templateStrings)
        : ExpressionNode(location)
        , m_templateStrings(templateStrings)
        , m_templateExpressions(nullptr)
    {
    }

    inline TemplateLiteralNode::TemplateLiteralNode(const JSTokenLocation& location, TemplateStringListNode* templateStrings, TemplateExpressionListNode* templateExpressions)
        : ExpressionNode(location)
        , m_templateStrings(templateStrings)
        , m_templateExpressions(templateExpressions)
    {
    }

    inline TaggedTemplateNode::TaggedTemplateNode(const JSTokenLocation& location, ExpressionNode* tag, TemplateLiteralNode* templateLiteral)
        : ExpressionNode(location)
        , m_tag(tag)
        , m_templateLiteral(templateLiteral)
    {
    }

    inline RegExpNode::RegExpNode(const JSTokenLocation& location, const Identifier& pattern, const Identifier& flags)
        : ExpressionNode(location)
        , m_pattern(pattern)
        , m_flags(flags)
    {
    }

    inline ThisNode::ThisNode(const JSTokenLocation& location)
        : ExpressionNode(location)
    {
    }

    inline SuperNode::SuperNode(const JSTokenLocation& location)
        : ExpressionNode(location)
    {
    }

    inline ImportNode::ImportNode(const JSTokenLocation& location, ExpressionNode* expr, ExpressionNode* option)
        : ExpressionNode(location)
        , m_expr(expr)
        , m_option(option)
    {
    }

    inline MetaPropertyNode::MetaPropertyNode(const JSTokenLocation& location)
        : ExpressionNode(location)
    {
    }

    inline NewTargetNode::NewTargetNode(const JSTokenLocation& location)
        : MetaPropertyNode(location)
    {
    }

    inline ImportMetaNode::ImportMetaNode(const JSTokenLocation& location, ExpressionNode* expr)
        : MetaPropertyNode(location)
        , m_expr(expr)
    {
    }

    inline ResolveNode::ResolveNode(const JSTokenLocation& location, const Identifier& ident, const JSTextPosition& start)
        : ExpressionNode(location)
        , m_ident(ident)
        , m_start(start)
    {
        ASSERT(m_start.offset >= m_start.lineStartOffset);
    }

    inline PrivateIdentifierNode::PrivateIdentifierNode(const JSTokenLocation& location, const Identifier& ident)
        : ExpressionNode(location)
        , m_ident(ident)
    {
    }

    inline ElementNode::ElementNode(int elision, ExpressionNode* node)
        : m_node(node)
        , m_elision(elision)
    {
    }

    inline ElementNode::ElementNode(ElementNode* l, int elision, ExpressionNode* node)
        : m_node(node)
        , m_elision(elision)
    {
        l->m_next = this;
    }

    inline ArrayNode::ArrayNode(const JSTokenLocation& location, int elision)
        : ExpressionNode(location)
        , m_element(nullptr)
        , m_elision(elision)
    {
    }

    inline ArrayNode::ArrayNode(const JSTokenLocation& location, ElementNode* element)
        : ExpressionNode(location)
        , m_element(element)
        , m_elision(0)
    {
    }

    inline ArrayNode::ArrayNode(const JSTokenLocation& location, int elision, ElementNode* element)
        : ExpressionNode(location)
        , m_element(element)
        , m_elision(elision)
    {
    }

    inline PropertyNode::PropertyNode(const Identifier& name, Type type, SuperBinding superBinding, ClassElementTag tag)
        : m_name(&name)
        , m_type(type)
        , m_needsSuperBinding(superBinding == SuperBinding::Needed)
        , m_classElementTag(static_cast<unsigned>(tag))
    {
        ASSERT(name.impl());
    }

    inline PropertyNode::PropertyNode(const Identifier& name, ExpressionNode* assign, Type type, SuperBinding superBinding, ClassElementTag tag)
        : m_name(&name)
        , m_assign(assign)
        , m_type(type)
        , m_needsSuperBinding(superBinding == SuperBinding::Needed)
        , m_classElementTag(static_cast<unsigned>(tag))
    {
        ASSERT(name.impl());
    }
    
    inline PropertyNode::PropertyNode(ExpressionNode* assign, Type type, SuperBinding superBinding, ClassElementTag tag)
        : m_assign(assign)
        , m_type(type)
        , m_needsSuperBinding(superBinding == SuperBinding::Needed)
        , m_classElementTag(static_cast<unsigned>(tag))
    {
    }

    inline PropertyNode::PropertyNode(ExpressionNode* name, ExpressionNode* assign, Type type, SuperBinding superBinding, ClassElementTag tag)
        : m_expression(name)
        , m_assign(assign)
        , m_type(type)
        , m_needsSuperBinding(superBinding == SuperBinding::Needed)
        , m_classElementTag(static_cast<unsigned>(tag))
    {
    }

    inline PropertyNode::PropertyNode(const Identifier& ident, ExpressionNode* name, ExpressionNode* assign, Type type, SuperBinding superBinding, ClassElementTag tag)
        : m_name(&ident)
        , m_expression(name)
        , m_assign(assign)
        , m_type(type)
        , m_needsSuperBinding(superBinding == SuperBinding::Needed)
        , m_classElementTag(static_cast<unsigned>(tag))
    {
        ASSERT(ident.impl());
    }

    inline PropertyListNode::PropertyListNode(const JSTokenLocation& location, PropertyNode* node)
        : ExpressionNode(location)
        , m_node(node)
    {
    }

    inline PropertyListNode::PropertyListNode(const JSTokenLocation& location, PropertyNode* node, PropertyListNode* list)
        : ExpressionNode(location)
        , m_node(node)
    {
        list->m_next = this;
    }

    inline ObjectLiteralNode::ObjectLiteralNode(const JSTokenLocation& location)
        : ExpressionNode(location)
        , m_list(nullptr)
    {
    }

    inline ObjectLiteralNode::ObjectLiteralNode(const JSTokenLocation& location, PropertyListNode* list)
        : ExpressionNode(location)
        , m_list(list)
    {
    }

    inline BracketAccessorNode::BracketAccessorNode(const JSTokenLocation& location, ExpressionNode* base, ExpressionNode* subscript, bool subscriptHasAssignments)
        : ExpressionNode(location)
        , m_base(base)
        , m_subscript(subscript)
        , m_subscriptHasAssignments(subscriptHasAssignments)
    {
    }

    inline BaseDotNode::BaseDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type)
        : ExpressionNode(location)
        , m_base(base)
        , m_ident(ident)
        , m_type(type)
    {
    }

    inline DotAccessorNode::DotAccessorNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type)
        : BaseDotNode(location, base, ident, type)
    {
    }
    
    
    inline SpreadExpressionNode::SpreadExpressionNode(const JSTokenLocation& location, ExpressionNode* expression)
        : ExpressionNode(location)
        , m_expression(expression)
    {
    }
    
    inline ObjectSpreadExpressionNode::ObjectSpreadExpressionNode(const JSTokenLocation& location, ExpressionNode* expression)
        : ExpressionNode(location)
        , m_expression(expression)
    {
    }

    inline ArgumentListNode::ArgumentListNode(const JSTokenLocation& location, ExpressionNode* expr)
        : ExpressionNode(location)
        , m_expr(expr)
    {
    }

    inline ArgumentListNode::ArgumentListNode(const JSTokenLocation& location, ArgumentListNode* listNode, ExpressionNode* expr)
        : ExpressionNode(location)
        , m_expr(expr)
    {
        listNode->m_next = this;
    }

    inline ArgumentsNode::ArgumentsNode()
        : m_listNode(nullptr)
    {
    }

    inline ArgumentsNode::ArgumentsNode(ArgumentListNode* listNode, bool hasAssignments)
        : m_listNode(listNode)
        , m_hasAssignments(hasAssignments)
    {
    }

    inline NewExprNode::NewExprNode(const JSTokenLocation& location, ExpressionNode* expr)
        : ExpressionNode(location)
        , m_expr(expr)
        , m_args(nullptr)
    {
    }

    inline NewExprNode::NewExprNode(const JSTokenLocation& location, ExpressionNode* expr, ArgumentsNode* args)
        : ExpressionNode(location)
        , m_expr(expr)
        , m_args(args)
    {
    }

    inline EvalFunctionCallNode::EvalFunctionCallNode(const JSTokenLocation& location, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_args(args)
    {
    }

    inline FunctionCallValueNode::FunctionCallValueNode(const JSTokenLocation& location, ExpressionNode* expr, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd, bool isOptionalCall)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_expr(expr)
        , m_args(args)
        , m_isOptionalCall(isOptionalCall)
    {
        ASSERT(divot.offset >= divotStart.offset);
    }

    inline StaticBlockFunctionCallNode::StaticBlockFunctionCallNode(const JSTokenLocation& location, ExpressionNode* expr, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_expr(expr)
    {
        ASSERT(divot.offset >= divotStart.offset);
    }

    inline FunctionCallResolveNode::FunctionCallResolveNode(const JSTokenLocation& location, const Identifier& ident, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd, bool isOptionalCall)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_ident(ident)
        , m_args(args)
        , m_isOptionalCall(isOptionalCall)
    {
    }

    inline FunctionCallBracketNode::FunctionCallBracketNode(const JSTokenLocation& location, ExpressionNode* base, ExpressionNode* subscript, bool subscriptHasAssignments, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd, bool isOptionalCall)
        : ExpressionNode(location)
        , ThrowableSubExpressionData(divot, divotStart, divotEnd)
        , m_base(base)
        , m_subscript(subscript)
        , m_args(args)
        , m_subscriptHasAssignments(subscriptHasAssignments)
        , m_isOptionalCall(isOptionalCall)
    {
    }

    inline FunctionCallDotNode::FunctionCallDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd, bool isOptionalCall)
        : BaseDotNode(location, base, ident, type)
        , ThrowableSubExpressionData(divot, divotStart, divotEnd)
        , m_args(args)
        , m_isOptionalCall(isOptionalCall)
    {
    }

    inline BytecodeIntrinsicNode::BytecodeIntrinsicNode(Type type, const JSTokenLocation& location, BytecodeIntrinsicRegistry::Entry entry, const Identifier& ident, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_entry(entry)
        , m_ident(ident)
        , m_args(args)
        , m_type(type)
    {
    }

    inline CallFunctionCallDotNode::CallFunctionCallDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd, bool isOptionalCall, size_t distanceToInnermostCallOrApply)
        : FunctionCallDotNode(location, base, ident, type, args, divot, divotStart, divotEnd, isOptionalCall)
        , m_distanceToInnermostCallOrApply(distanceToInnermostCallOrApply)
    {
    }

    inline ApplyFunctionCallDotNode::ApplyFunctionCallDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd, bool isOptionalCall, size_t distanceToInnermostCallOrApply)
        : FunctionCallDotNode(location, base, ident, type, args, divot, divotStart, divotEnd, isOptionalCall)
        , m_distanceToInnermostCallOrApply(distanceToInnermostCallOrApply)
    {
    }

    inline HasOwnPropertyFunctionCallDotNode::HasOwnPropertyFunctionCallDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type, ArgumentsNode* args, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd, bool isOptionalCall)
        : FunctionCallDotNode(location, base, ident, type, args, divot, divotStart, divotEnd, isOptionalCall)
    {
    }

    inline PostfixNode::PostfixNode(const JSTokenLocation& location, ExpressionNode* expr, Operator oper, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : PrefixNode(location, expr, oper, divot, divotStart, divotEnd)
    {
    }

    inline DeleteResolveNode::DeleteResolveNode(const JSTokenLocation& location, const Identifier& ident, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_ident(ident)
    {
    }

    inline DeleteBracketNode::DeleteBracketNode(const JSTokenLocation& location, ExpressionNode* base, ExpressionNode* subscript, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_base(base)
        , m_subscript(subscript)
    {
    }

    inline DeleteDotNode::DeleteDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_base(base)
        , m_ident(ident)
    {
    }

    inline DeleteValueNode::DeleteValueNode(const JSTokenLocation& location, ExpressionNode* expr)
        : ExpressionNode(location)
        , m_expr(expr)
    {
    }

    inline VoidNode::VoidNode(const JSTokenLocation& location, ExpressionNode* expr)
        : ExpressionNode(location)
        , m_expr(expr)
    {
    }

    inline TypeOfResolveNode::TypeOfResolveNode(const JSTokenLocation& location, const Identifier& ident)
        : ExpressionNode(location, ResultType::stringType())
        , m_ident(ident)
    {
    }

    inline TypeOfValueNode::TypeOfValueNode(const JSTokenLocation& location, ExpressionNode* expr)
        : ExpressionNode(location, ResultType::stringType())
        , m_expr(expr)
    {
    }

    inline PrefixNode::PrefixNode(const JSTokenLocation& location, ExpressionNode* expr, Operator oper, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowablePrefixedSubExpressionData(divot, divotStart, divotEnd)
        , m_expr(expr)
        , m_operator(oper)
    {
    }

    inline UnaryOpNode::UnaryOpNode(const JSTokenLocation& location, ResultType type, ExpressionNode* expr, OpcodeID opcodeID)
        : ExpressionNode(location, type)
        , m_expr(expr)
        , m_opcodeID(opcodeID)
    {
    }

    // UnaryPlus is guaranteed to always return a number, never a BigInt.
    // See https://tc39.es/ecma262/#sec-unary-plus-operator-runtime-semantics-evaluation
    inline UnaryPlusNode::UnaryPlusNode(const JSTokenLocation& location, ExpressionNode* expr)
        : UnaryOpNode(location, ResultType::numberType(), expr, op_to_number)
    {
    }

    inline NegateNode::NegateNode(const JSTokenLocation& location, ExpressionNode* expr)
        : UnaryOpNode(location, ResultType::forUnaryArith(expr->resultDescriptor()), expr, op_negate)
    {
    }

    inline BitwiseNotNode::BitwiseNotNode(const JSTokenLocation& location, ExpressionNode* expr)
        : UnaryOpNode(location, ResultType::forBitOp(), expr, op_bitnot)
    {
    }

    inline LogicalNotNode::LogicalNotNode(const JSTokenLocation& location, ExpressionNode* expr)
        : UnaryOpNode(location, ResultType::booleanType(), expr, op_not)
    {
    }

    inline BinaryOpNode::BinaryOpNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, OpcodeID opcodeID, bool rightHasAssignments)
        : ExpressionNode(location)
        , m_rightHasAssignments(rightHasAssignments)
        , m_opcodeID(opcodeID)
        , m_expr1(expr1)
        , m_expr2(expr2)
    {
    }

    inline BinaryOpNode::BinaryOpNode(const JSTokenLocation& location, ResultType type, ExpressionNode* expr1, ExpressionNode* expr2, OpcodeID opcodeID, bool rightHasAssignments)
        : ExpressionNode(location, type)
        , m_rightHasAssignments(rightHasAssignments)
        , m_opcodeID(opcodeID)
        , m_expr1(expr1)
        , m_expr2(expr2)
    {
    }

    inline PowNode::PowNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forNonAddArith(expr1->resultDescriptor(), expr2->resultDescriptor()), expr1, expr2, op_pow, rightHasAssignments)
    {
    }

    inline MultNode::MultNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forNonAddArith(expr1->resultDescriptor(), expr2->resultDescriptor()), expr1, expr2, op_mul, rightHasAssignments)
    {
    }

    inline DivNode::DivNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forNonAddArith(expr1->resultDescriptor(), expr2->resultDescriptor()), expr1, expr2, op_div, rightHasAssignments)
    {
    }


    inline ModNode::ModNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forNonAddArith(expr1->resultDescriptor(), expr2->resultDescriptor()), expr1, expr2, op_mod, rightHasAssignments)
    {
    }

    inline AddNode::AddNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forAdd(expr1->resultDescriptor(), expr2->resultDescriptor()), expr1, expr2, op_add, rightHasAssignments)
    {
    }

    inline SubNode::SubNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forNonAddArith(expr1->resultDescriptor(), expr2->resultDescriptor()), expr1, expr2, op_sub, rightHasAssignments)
    {
    }

    inline LeftShiftNode::LeftShiftNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forBitOp(), expr1, expr2, op_lshift, rightHasAssignments)
    {
    }

    inline RightShiftNode::RightShiftNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forBitOp(), expr1, expr2, op_rshift, rightHasAssignments)
    {
    }

    inline UnsignedRightShiftNode::UnsignedRightShiftNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::numberType(), expr1, expr2, op_urshift, rightHasAssignments)
    {
    }

    inline LessNode::LessNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_less, rightHasAssignments)
    {
    }

    inline GreaterNode::GreaterNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_greater, rightHasAssignments)
    {
    }

    inline LessEqNode::LessEqNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_lesseq, rightHasAssignments)
    {
    }

    inline GreaterEqNode::GreaterEqNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_greatereq, rightHasAssignments)
    {
    }

    inline ThrowableBinaryOpNode::ThrowableBinaryOpNode(const JSTokenLocation& location, ResultType type, ExpressionNode* expr1, ExpressionNode* expr2, OpcodeID opcodeID, bool rightHasAssignments)
        : BinaryOpNode(location, type, expr1, expr2, opcodeID, rightHasAssignments)
    {
    }

    inline ThrowableBinaryOpNode::ThrowableBinaryOpNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, OpcodeID opcodeID, bool rightHasAssignments)
        : BinaryOpNode(location, expr1, expr2, opcodeID, rightHasAssignments)
    {
    }

    inline InstanceOfNode::InstanceOfNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : ThrowableBinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_instanceof, rightHasAssignments)
    {
    }

    inline InNode::InNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : ThrowableBinaryOpNode(location, expr1, expr2, op_in_by_val, rightHasAssignments)
    {
    }

    inline EqualNode::EqualNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_eq, rightHasAssignments)
    {
    }

    inline NotEqualNode::NotEqualNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_neq, rightHasAssignments)
    {
    }

    inline StrictEqualNode::StrictEqualNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_stricteq, rightHasAssignments)
    {
    }

    inline NotStrictEqualNode::NotStrictEqualNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::booleanType(), expr1, expr2, op_nstricteq, rightHasAssignments)
    {
    }

    inline BitAndNode::BitAndNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forBitOp(), expr1, expr2, op_bitand, rightHasAssignments)
    {
    }

    inline BitOrNode::BitOrNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forBitOp(), expr1, expr2, op_bitor, rightHasAssignments)
    {
    }

    inline BitXOrNode::BitXOrNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool rightHasAssignments)
        : BinaryOpNode(location, ResultType::forBitOp(), expr1, expr2, op_bitxor, rightHasAssignments)
    {
    }

    inline LogicalOpNode::LogicalOpNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, LogicalOperator oper)
        : ExpressionNode(location, ResultType::forLogicalOp(expr1->resultDescriptor(), expr2->resultDescriptor()))
        , m_operator(oper)
        , m_expr1(expr1)
        , m_expr2(expr2)
    {
    }

    inline CoalesceNode::CoalesceNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, bool hasAbsorbedOptionalChain)
        : ExpressionNode(location, ResultType::forCoalesce(expr1->resultDescriptor(), expr2->resultDescriptor()))
        , m_expr1(expr1)
        , m_expr2(expr2)
        , m_hasAbsorbedOptionalChain(hasAbsorbedOptionalChain)
    {
    }

    inline OptionalChainNode::OptionalChainNode(const JSTokenLocation& location, ExpressionNode* expr, bool isOutermost)
        : ExpressionNode(location)
        , m_expr(expr)
        , m_isOutermost(isOutermost)
    {
    }

    inline ConditionalNode::ConditionalNode(const JSTokenLocation& location, ExpressionNode* logical, ExpressionNode* expr1, ExpressionNode* expr2)
        : ExpressionNode(location)
        , m_logical(logical)
        , m_expr1(expr1)
        , m_expr2(expr2)
    {
    }

    inline ReadModifyResolveNode::ReadModifyResolveNode(const JSTokenLocation& location, const Identifier& ident, Operator oper, ExpressionNode*  right, bool rightHasAssignments, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_ident(ident)
        , m_right(right)
        , m_operator(oper)
        , m_rightHasAssignments(rightHasAssignments)
    {
    }

    inline ShortCircuitReadModifyResolveNode::ShortCircuitReadModifyResolveNode(const JSTokenLocation& location, const Identifier& ident, Operator oper, ExpressionNode* right, bool rightHasAssignments, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_ident(ident)
        , m_right(right)
        , m_operator(oper)
        , m_rightHasAssignments(rightHasAssignments)
    {
    }

    inline AssignResolveNode::AssignResolveNode(const JSTokenLocation& location, const Identifier& ident, ExpressionNode* right, AssignmentContext assignmentContext)
        : ExpressionNode(location)
        , m_ident(ident)
        , m_right(right)
        , m_assignmentContext(assignmentContext)
    {
    }


    inline ReadModifyBracketNode::ReadModifyBracketNode(const JSTokenLocation& location, ExpressionNode* base, ExpressionNode* subscript, Operator oper, ExpressionNode* right, bool subscriptHasAssignments, bool rightHasAssignments, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableSubExpressionData(divot, divotStart, divotEnd)
        , m_base(base)
        , m_subscript(subscript)
        , m_right(right)
        , m_operator(oper)
        , m_subscriptHasAssignments(subscriptHasAssignments)
        , m_rightHasAssignments(rightHasAssignments)
    {
    }

    inline ShortCircuitReadModifyBracketNode::ShortCircuitReadModifyBracketNode(const JSTokenLocation& location, ExpressionNode* base, ExpressionNode* subscript, Operator oper, ExpressionNode* right, bool subscriptHasAssignments, bool rightHasAssignments, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableSubExpressionData(divot, divotStart, divotEnd)
        , m_base(base)
        , m_subscript(subscript)
        , m_right(right)
        , m_operator(oper)
        , m_subscriptHasAssignments(subscriptHasAssignments)
        , m_rightHasAssignments(rightHasAssignments)
    {
    }

    inline AssignBracketNode::AssignBracketNode(const JSTokenLocation& location, ExpressionNode* base, ExpressionNode* subscript, ExpressionNode* right, bool subscriptHasAssignments, bool rightHasAssignments, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_base(base)
        , m_subscript(subscript)
        , m_right(right)
        , m_subscriptHasAssignments(subscriptHasAssignments)
        , m_rightHasAssignments(rightHasAssignments)
    {
    }

    inline AssignDotNode::AssignDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type, ExpressionNode* right, bool rightHasAssignments, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : BaseDotNode(location, base, ident, type)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
        , m_right(right)
        , m_rightHasAssignments(rightHasAssignments)
    {
    }

    inline ReadModifyDotNode::ReadModifyDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type, Operator oper, ExpressionNode* right, bool rightHasAssignments, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : BaseDotNode(location, base, ident, type)
        , ThrowableSubExpressionData(divot, divotStart, divotEnd)
        , m_right(right)
        , m_operator(oper)
        , m_rightHasAssignments(rightHasAssignments)
    {
    }

    inline ShortCircuitReadModifyDotNode::ShortCircuitReadModifyDotNode(const JSTokenLocation& location, ExpressionNode* base, const Identifier& ident, DotType type, Operator oper, ExpressionNode* right, bool rightHasAssignments, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : BaseDotNode(location, base, ident, type)
        , ThrowableSubExpressionData(divot, divotStart, divotEnd)
        , m_right(right)
        , m_operator(oper)
        , m_rightHasAssignments(rightHasAssignments)
    {
    }

    inline AssignErrorNode::AssignErrorNode(const JSTokenLocation& location, const JSTextPosition& divot, const JSTextPosition& divotStart, const JSTextPosition& divotEnd)
        : ExpressionNode(location)
        , ThrowableExpressionData(divot, divotStart, divotEnd)
    {
    }

    inline CommaNode::CommaNode(const JSTokenLocation& location, ExpressionNode* expr)
        : ExpressionNode(location)
        , m_expr(expr)
    {
    }

    inline SourceElements::SourceElements()
    {
    }

    inline EmptyStatementNode::EmptyStatementNode(const JSTokenLocation& location)
        : StatementNode(location)
    {
    }

    inline DebuggerStatementNode::DebuggerStatementNode(const JSTokenLocation& location)
        : StatementNode(location)
    {
    }
    
    inline ExprStatementNode::ExprStatementNode(const JSTokenLocation& location, ExpressionNode* expr)
        : StatementNode(location)
        , m_expr(expr)
    {
    }

    inline DeclarationStatement::DeclarationStatement(const JSTokenLocation& location, ExpressionNode* expr)
        : StatementNode(location)
        , m_expr(expr)
    {
    }

    inline ModuleDeclarationNode::ModuleDeclarationNode(const JSTokenLocation& location)
        : StatementNode(location)
    {
    }

    inline ModuleNameNode::ModuleNameNode(const JSTokenLocation& location, const Identifier& moduleName)
        : Node(location)
        , m_moduleName(moduleName)
    {
    }

    inline ImportSpecifierNode::ImportSpecifierNode(const JSTokenLocation& location, const Identifier& importedName, const Identifier& localName)
        : Node(location)
        , m_importedName(importedName)
        , m_localName(localName)
    {
    }

    inline ImportDeclarationNode::ImportDeclarationNode(const JSTokenLocation& location, ImportType type, ImportSpecifierListNode* importSpecifierList, ModuleNameNode* moduleName, ImportAttributesListNode* importAttributesList)
        : ModuleDeclarationNode(location)
        , m_specifierList(importSpecifierList)
        , m_moduleName(moduleName)
        , m_attributesList(importAttributesList)
        , m_type(type)
    {
    }

    inline ExportAllDeclarationNode::ExportAllDeclarationNode(const JSTokenLocation& location, ModuleNameNode* moduleName, ImportAttributesListNode* importAttributesList)
        : ModuleDeclarationNode(location)
        , m_moduleName(moduleName)
        , m_attributesList(importAttributesList)
    {
    }

    inline ExportDefaultDeclarationNode::ExportDefaultDeclarationNode(const JSTokenLocation& location, StatementNode* declaration, const Identifier& localName)
        : ModuleDeclarationNode(location)
        , m_declaration(declaration)
        , m_localName(localName)
    {
    }

    inline ExportLocalDeclarationNode::ExportLocalDeclarationNode(const JSTokenLocation& location, StatementNode* declaration)
        : ModuleDeclarationNode(location)
        , m_declaration(declaration)
    {
    }

    inline ExportNamedDeclarationNode::ExportNamedDeclarationNode(const JSTokenLocation& location, ExportSpecifierListNode* exportSpecifierList, ModuleNameNode* moduleName, ImportAttributesListNode* importAttributesList)
        : ModuleDeclarationNode(location)
        , m_specifierList(exportSpecifierList)
        , m_moduleName(moduleName)
        , m_attributesList(importAttributesList)
    {
    }

    inline ExportSpecifierNode::ExportSpecifierNode(const JSTokenLocation& location, const Identifier& localName, const Identifier& exportedName)
        : Node(location)
        , m_localName(localName)
        , m_exportedName(exportedName)
    {
    }

    inline EmptyVarExpression::EmptyVarExpression(const JSTokenLocation& location, const Identifier& ident)
        : ExpressionNode(location)
        , m_ident(ident)
    {
    }

    inline EmptyLetExpression::EmptyLetExpression(const JSTokenLocation& location, const Identifier& ident)
        : ExpressionNode(location)
        , m_ident(ident)
    {
    }
    
    inline IfElseNode::IfElseNode(const JSTokenLocation& location, ExpressionNode* condition, StatementNode* ifBlock, StatementNode* elseBlock)
        : StatementNode(location)
        , m_condition(condition)
        , m_ifBlock(ifBlock)
        , m_elseBlock(elseBlock)
    {
    }

    inline DoWhileNode::DoWhileNode(const JSTokenLocation& location, StatementNode* statement, ExpressionNode* expr)
        : StatementNode(location)
        , m_statement(statement)
        , m_expr(expr)
    {
    }

    inline WhileNode::WhileNode(const JSTokenLocation& location, ExpressionNode* expr, StatementNode* statement)
        : StatementNode(location)
        , m_expr(expr)
        , m_statement(statement)
    {
    }

    inline ForNode::ForNode(const JSTokenLocation& location, ExpressionNode* expr1, ExpressionNode* expr2, ExpressionNode* expr3, StatementNode* statement, VariableEnvironment&& lexicalVariables, bool initializerContainsClosure)
        : StatementNode(location)
        , VariableEnvironmentNode(WTFMove(lexicalVariables))
        , m_expr1(expr1)
        , m_expr2(expr2)
        , m_expr3(expr3)
        , m_statement(statement)
        , m_initializerContainsClosure(initializerContainsClosure)
    {
        ASSERT(statement);
    }

    inline ContinueNode::ContinueNode(const JSTokenLocation& location, const Identifier& ident)
        : StatementNode(location)
        , m_ident(ident)
    {
    }
    
    inline BreakNode::BreakNode(const JSTokenLocation& location, const Identifier& ident)
        : StatementNode(location)
        , m_ident(ident)
    {
    }
    
    inline ReturnNode::ReturnNode(const JSTokenLocation& location, ExpressionNode* value)
        : StatementNode(location)
        , m_value(value)
    {
    }

    inline WithNode::WithNode(const JSTokenLocation& location, ExpressionNode* expr, StatementNode* statement, const JSTextPosition& divot, uint32_t expressionLength)
        : StatementNode(location)
        , m_expr(expr)
        , m_statement(statement)
        , m_divot(divot)
        , m_expressionLength(expressionLength)
    {
    }

    inline LabelNode::LabelNode(const JSTokenLocation& location, const Identifier& name, StatementNode* statement)
        : StatementNode(location)
        , m_name(name)
        , m_statement(statement)
    {
    }

    inline ThrowNode::ThrowNode(const JSTokenLocation& location, ExpressionNode* expr)
        : StatementNode(location)
        , m_expr(expr)
    {
    }

    inline TryNode::TryNode(const JSTokenLocation& location, StatementNode* tryBlock, DestructuringPatternNode* catchPattern, StatementNode* catchBlock, VariableEnvironment&& catchEnvironment, StatementNode* finallyBlock)
        : StatementNode(location)
        , VariableEnvironmentNode(WTFMove(catchEnvironment))
        , m_tryBlock(tryBlock)
        , m_catchPattern(catchPattern)
        , m_catchBlock(catchBlock)
        , m_finallyBlock(finallyBlock)
    {
    }

    inline FunctionParameters::FunctionParameters()
    {
    }

    
    inline BaseFuncExprNode::BaseFuncExprNode(const JSTokenLocation& location, const Identifier& ident, FunctionMetadataNode* metadata, const SourceCode& source, FunctionMode functionMode)
        : ExpressionNode(location)
        , m_metadata(metadata)
    {
        m_metadata->finishParsing(source, ident, functionMode);
    }

    inline FuncExprNode::FuncExprNode(const JSTokenLocation& location, const Identifier& ident, FunctionMetadataNode* metadata, const SourceCode& source)
        : BaseFuncExprNode(location, ident, metadata, source, FunctionMode::FunctionExpression)
    {
    }

    inline FuncExprNode::FuncExprNode(const JSTokenLocation& location, const Identifier& ident, FunctionMetadataNode* metadata, const SourceCode& source, FunctionMode functionMode)
        : BaseFuncExprNode(location, ident, metadata, source, functionMode)
    {
    }
    
    inline FuncDeclNode::FuncDeclNode(const JSTokenLocation& location, const Identifier& ident, FunctionMetadataNode* metadata, const SourceCode& source)
        : StatementNode(location)
        , m_metadata(metadata)
    {
        m_metadata->finishParsing(source, ident, FunctionMode::FunctionDeclaration);
    }

    inline ArrowFuncExprNode::ArrowFuncExprNode(const JSTokenLocation& location, const Identifier& ident, FunctionMetadataNode* metadata, const SourceCode& source)
        : BaseFuncExprNode(location, ident, metadata, source, FunctionMode::FunctionExpression)
    {
    }

    inline MethodDefinitionNode::MethodDefinitionNode(const JSTokenLocation& location, const Identifier& ident, FunctionMetadataNode* metadata, const SourceCode& source)
        : FuncExprNode(location, ident, metadata, source, FunctionMode::MethodDefinition)
    {
    }
    
    inline YieldExprNode::YieldExprNode(const JSTokenLocation& location, ExpressionNode* argument, bool delegate)
        : ExpressionNode(location)
        , m_argument(argument)
        , m_delegate(delegate)
    {
    }

    inline AwaitExprNode::AwaitExprNode(const JSTokenLocation& location, ExpressionNode* argument)
        : ExpressionNode(location)
        , m_argument(argument)
    {
    }

    inline DefineFieldNode::DefineFieldNode(const JSTokenLocation& location, const Identifier& ident, ExpressionNode* assign, Type type)
        : StatementNode(location)
        , m_ident(ident)
        , m_assign(assign)
        , m_type(type)
    {
    }

    inline ClassDeclNode::ClassDeclNode(const JSTokenLocation& location, ExpressionNode* classDeclaration)
        : StatementNode(location)
        , m_classDeclaration(classDeclaration)
    {
    }

    inline ClassExprNode::ClassExprNode(const JSTokenLocation& location, const Identifier& name, const SourceCode& classSource, VariableEnvironment&& classHeadEnvironment, VariableEnvironment&& classEnvironment, ExpressionNode* constructorExpression, ExpressionNode* classHeritage, PropertyListNode* classElements)
        : ExpressionNode(location)
        , VariableEnvironmentNode(WTFMove(classEnvironment))
        , m_classHeadEnvironment(WTFMove(classHeadEnvironment))
        , m_classSource(classSource)
        , m_name(name)
        , m_ecmaName(&name)
        , m_constructorExpression(constructorExpression)
        , m_classHeritage(classHeritage)
        , m_classElements(classElements)
        , m_needsLexicalScope(PropertyListNode::shouldCreateLexicalScopeForClass(classElements))
    {
    }

    inline CaseClauseNode::CaseClauseNode(ExpressionNode* expr, SourceElements* statements)
        : m_expr(expr)
        , m_statements(statements)
    {
    }

    inline ClauseListNode::ClauseListNode(CaseClauseNode* clause)
        : m_clause(clause)
    {
    }

    inline ClauseListNode::ClauseListNode(ClauseListNode* clauseList, CaseClauseNode* clause)
        : m_clause(clause)
    {
        clauseList->m_next = this;
    }

    inline CaseBlockNode::CaseBlockNode(ClauseListNode* list1, CaseClauseNode* defaultClause, ClauseListNode* list2)
        : m_list1(list1)
        , m_defaultClause(defaultClause)
        , m_list2(list2)
    {
    }

    inline SwitchNode::SwitchNode(const JSTokenLocation& location, ExpressionNode* expr, CaseBlockNode* block, VariableEnvironment&& lexicalVariables, FunctionStack&& functionStack)
        : StatementNode(location)
        , VariableEnvironmentNode(WTFMove(lexicalVariables), WTFMove(functionStack))
        , m_expr(expr)
        , m_block(block)
    {
    }

    inline BlockNode::BlockNode(const JSTokenLocation& location, SourceElements* statements, VariableEnvironment&& lexicalVariables, FunctionStack&& functionStack)
        : StatementNode(location)
        , VariableEnvironmentNode(WTFMove(lexicalVariables), WTFMove(functionStack))
        , m_statements(statements)
    {
    }

    inline EnumerationNode::EnumerationNode(const JSTokenLocation& location, ExpressionNode* lexpr, ExpressionNode* expr, StatementNode* statement, VariableEnvironment&& lexicalVariables)
        : StatementNode(location)
        , VariableEnvironmentNode(WTFMove(lexicalVariables))
        , m_lexpr(lexpr)
        , m_expr(expr)
        , m_statement(statement)
    {
        ASSERT(lexpr);
    }
    
    inline ForInNode::ForInNode(const JSTokenLocation& location, ExpressionNode* lexpr, ExpressionNode* expr, StatementNode* statement, VariableEnvironment&& lexicalVariables)
        : EnumerationNode(location, lexpr, expr, statement, WTFMove(lexicalVariables))
    {
    }
    
    inline ForOfNode::ForOfNode(bool isForAwait, const JSTokenLocation& location, ExpressionNode* lexpr, ExpressionNode* expr, StatementNode* statement, VariableEnvironment&& lexicalVariables)
        : EnumerationNode(location, lexpr, expr, statement, WTFMove(lexicalVariables))
        , m_isForAwait(isForAwait)
    {
    }
    
    inline DestructuringPatternNode::DestructuringPatternNode()
    {
    }

    inline ArrayPatternNode::ArrayPatternNode()
        : DestructuringPatternNode()
    {
    }
    
    inline ObjectPatternNode::ObjectPatternNode()
        : DestructuringPatternNode()
    {
    }
    
    inline BindingNode::BindingNode(const Identifier& boundProperty, const JSTextPosition& start, const JSTextPosition& end, AssignmentContext context)
        : DestructuringPatternNode()
        , m_divotStart(start)
        , m_divotEnd(end)
        , m_boundProperty(boundProperty)
        , m_bindingContext(context)
    {
    }

    inline AssignmentElementNode::AssignmentElementNode(ExpressionNode* assignmentTarget, const JSTextPosition& start, const JSTextPosition& end)
        : DestructuringPatternNode()
        , m_divotStart(start)
        , m_divotEnd(end)
        , m_assignmentTarget(assignmentTarget)
    {
    }

    inline RestParameterNode::RestParameterNode(DestructuringPatternNode* pattern, unsigned numParametersToSkip)
        : DestructuringPatternNode()
        , m_pattern(pattern)
        , m_numParametersToSkip(numParametersToSkip)
    {
        ASSERT(!pattern->isRestParameter());
    }

    inline DestructuringAssignmentNode::DestructuringAssignmentNode(const JSTokenLocation& location, DestructuringPatternNode* bindings, ExpressionNode* initializer)
        : ExpressionNode(location)
        , m_bindings(bindings)
        , m_initializer(initializer)
    {
    }
    
} // namespace JSC
