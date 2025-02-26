/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

namespace JSC {

class AbstractSlotVisitor;
class JSCell;
class SlotVisitor;

#define UNUSED_MODIFIER_ARGUMENT /* unused */

#define DECLARE_UNUSED_STRUCT_TO_TERMINATE_VISIT_MACRO_EXPANDER_IMPL(counter) \
    struct UnusedSlotVisitorMacroStructSoWeCanHaveASemicolon##counter { }

#define DECLARE_UNUSED_STRUCT_TO_TERMINATE_VISIT_MACRO_EXPANDER(counter) \
    DECLARE_UNUSED_STRUCT_TO_TERMINATE_VISIT_MACRO_EXPANDER_IMPL(counter)

#define DECLARE_UNUSED_STRUCT_TO_TERMINATE_VISIT_MACRO \
    DECLARE_UNUSED_STRUCT_TO_TERMINATE_VISIT_MACRO_EXPANDER(__COUNTER__)

// Macros for visitAggregate().

#define DECLARE_VISIT_AGGREGATE_WITH_MODIFIER(postModifier) \
private: \
    template<typename Visitor> ALWAYS_INLINE void visitAggregateImpl(Visitor&) postModifier; \
public: \
    void visitAggregate(AbstractSlotVisitor&) postModifier; \
    void visitAggregate(SlotVisitor&) postModifier

#define DECLARE_VISIT_AGGREGATE \
    DECLARE_VISIT_AGGREGATE_WITH_MODIFIER(UNUSED_MODIFIER_ARGUMENT)

#define DEFINE_VISIT_AGGREGATE_WITH_MODIFIER(className, postModifier) \
    void className::visitAggregate(AbstractSlotVisitor& visitor) postModifier { visitAggregateImpl(visitor); } \
    void className::visitAggregate(SlotVisitor& visitor) postModifier { visitAggregateImpl(visitor); } \
    DECLARE_UNUSED_STRUCT_TO_TERMINATE_VISIT_MACRO

#define DEFINE_VISIT_AGGREGATE(className) \
    DEFINE_VISIT_AGGREGATE_WITH_MODIFIER(className, UNUSED_MODIFIER_ARGUMENT)

// Macros for static visitChildren().

#define DECLARE_VISIT_CHILDREN_WITH_MODIFIER(preModifier) \
private: \
    template<typename Visitor> ALWAYS_INLINE static void visitChildrenImpl(JSCell*, Visitor&); \
public: \
    preModifier static void visitChildren(JSCell*, AbstractSlotVisitor&); \
    preModifier static void visitChildren(JSCell*, SlotVisitor&)

#define DECLARE_VISIT_CHILDREN \
    DECLARE_VISIT_CHILDREN_WITH_MODIFIER(UNUSED_MODIFIER_ARGUMENT)

#define DEFINE_VISIT_CHILDREN_WITH_MODIFIER(preModifier, className) \
    preModifier void className::visitChildren(JSCell* cell, AbstractSlotVisitor& visitor) \
    { \
        AbstractSlotVisitor::ReferrerContext context(visitor, cell); \
        visitChildrenImpl(cell, visitor); \
    } \
    preModifier void className::visitChildren(JSCell* cell, SlotVisitor& visitor) { visitChildrenImpl(cell, visitor); } \
    DECLARE_UNUSED_STRUCT_TO_TERMINATE_VISIT_MACRO

#define DEFINE_VISIT_CHILDREN(className) \
    DEFINE_VISIT_CHILDREN_WITH_MODIFIER(UNUSED_MODIFIER_ARGUMENT, className)

// Macros for static visitOutputConstraints().

#define DECLARE_VISIT_OUTPUT_CONSTRAINTS_WITH_MODIFIER(preModifier) \
private: \
    template<typename Visitor> ALWAYS_INLINE static void visitOutputConstraintsImpl(JSCell*, Visitor&); \
public: \
    preModifier static void visitOutputConstraints(JSCell*, AbstractSlotVisitor&); \
    preModifier static void visitOutputConstraints(JSCell*, SlotVisitor&)

#define DECLARE_VISIT_OUTPUT_CONSTRAINTS \
    DECLARE_VISIT_OUTPUT_CONSTRAINTS_WITH_MODIFIER(UNUSED_MODIFIER_ARGUMENT)

#define DEFINE_VISIT_OUTPUT_CONSTRAINTS_WITH_MODIFIER(preModifier, className) \
    preModifier void className::visitOutputConstraints(JSCell* cell, AbstractSlotVisitor& visitor) \
    { \
        AbstractSlotVisitor::ReferrerContext context(visitor, cell); \
        visitOutputConstraintsImpl(cell, visitor); \
    } \
    preModifier void className::visitOutputConstraints(JSCell* cell, SlotVisitor& visitor) { visitOutputConstraintsImpl(cell, visitor); } \
    DECLARE_UNUSED_STRUCT_TO_TERMINATE_VISIT_MACRO

#define DEFINE_VISIT_OUTPUT_CONSTRAINTS(className) \
    DEFINE_VISIT_OUTPUT_CONSTRAINTS_WITH_MODIFIER(UNUSED_MODIFIER_ARGUMENT, className)

// Macros for visitAdditionalChildren().

#define DEFINE_VISIT_ADDITIONAL_CHILDREN(className) \
    template void className::visitAdditionalChildren(JSC::AbstractSlotVisitor&); \
    template void className::visitAdditionalChildren(JSC::SlotVisitor&)

} // namespace JSC

using JSC::AbstractSlotVisitor;
using JSC::JSCell;
using JSC::SlotVisitor;
