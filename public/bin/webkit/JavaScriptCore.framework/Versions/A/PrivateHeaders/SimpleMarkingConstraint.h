/*
 * Copyright (C) 2017-2021 Apple Inc. All rights reserved.
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

#pragma once

#include "MarkingConstraint.h"
#include "MarkingConstraintExecutorPair.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {

// This allows for an informal way to define constraints. Just pass a lambda to the constructor. The only
// downside is that this makes it hard for constraints to override any functions in MarkingConstraint
// other than executeImpl. In those cases, just subclass MarkingConstraint.
class SimpleMarkingConstraint final : public MarkingConstraint {
    WTF_MAKE_TZONE_ALLOCATED(SimpleMarkingConstraint);
public:
    JS_EXPORT_PRIVATE SimpleMarkingConstraint(
        CString abbreviatedName, CString name,
        MarkingConstraintExecutorPair&&,
        ConstraintVolatility,
        ConstraintConcurrency = ConstraintConcurrency::Concurrent,
        ConstraintParallelism = ConstraintParallelism::Sequential);
    
    SimpleMarkingConstraint(
        CString abbreviatedName, CString name,
        MarkingConstraintExecutorPair&& executors,
        ConstraintVolatility volatility,
        ConstraintParallelism parallelism)
        : SimpleMarkingConstraint(abbreviatedName, name, WTFMove(executors), volatility, ConstraintConcurrency::Concurrent, parallelism)
    {
    }
    
    JS_EXPORT_PRIVATE ~SimpleMarkingConstraint() final;
    
private:
    template<typename Visitor> ALWAYS_INLINE void executeImplImpl(Visitor&);
    void executeImpl(AbstractSlotVisitor&) final;
    void executeImpl(SlotVisitor&) final;

    MarkingConstraintExecutorPair m_executors;
};

} // namespace JSC

