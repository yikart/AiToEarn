/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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

#include "ConstraintConcurrency.h"
#include "ConstraintParallelism.h"
#include "ConstraintVolatility.h"
#include <limits.h>
#include <wtf/Lock.h>
#include <wtf/Noncopyable.h>
#include <wtf/SharedTask.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/CString.h>

namespace JSC {

class MarkingConstraintSet;
class AbstractSlotVisitor;
class SlotVisitor;

class MarkingConstraint {
    WTF_MAKE_NONCOPYABLE(MarkingConstraint);
    WTF_MAKE_TZONE_ALLOCATED(MarkingConstraint);
public:
    JS_EXPORT_PRIVATE MarkingConstraint(
        CString abbreviatedName, CString name, ConstraintVolatility,
        ConstraintConcurrency = ConstraintConcurrency::Concurrent,
        ConstraintParallelism = ConstraintParallelism::Sequential);
    
    JS_EXPORT_PRIVATE virtual ~MarkingConstraint();
    
    unsigned index() const { return m_index; }
    
    const char* abbreviatedName() const { return m_abbreviatedName.data(); }
    const char* name() const { return m_name.data(); }
    
    void resetStats();
    
    size_t lastVisitCount() const { return m_lastVisitCount; }
    
    // The following functions are only used by the real GC via the MarkingConstraintSolver.
    // Hence, we only need the SlotVisitor version.
    void execute(SlotVisitor&);

    JS_EXPORT_PRIVATE virtual double quickWorkEstimate(SlotVisitor&);
    
    double workEstimate(SlotVisitor&);
    
    void prepareToExecute(const AbstractLocker& constraintSolvingLocker, SlotVisitor&);
    
    void doParallelWork(SlotVisitor&, SharedTask<void(SlotVisitor&)>&);
    
    ConstraintVolatility volatility() const { return m_volatility; }
    
    ConstraintConcurrency concurrency() const { return m_concurrency; }
    ConstraintParallelism parallelism() const { return m_parallelism; }

protected:
    virtual void executeImpl(AbstractSlotVisitor&) = 0;
    virtual void executeImpl(SlotVisitor&) = 0;
    JS_EXPORT_PRIVATE virtual void prepareToExecuteImpl(const AbstractLocker& constraintSolvingLocker, AbstractSlotVisitor&);

    // This function is only used by the verifier GC via Heap::verifyGC().
    // Hence, we only need the AbstractSlotVisitor version.
    void executeSynchronously(AbstractSlotVisitor&);

private:
    friend class MarkingConstraintSet; // So it can set m_index.
    
    CString m_abbreviatedName;
    CString m_name;
    size_t m_lastVisitCount { 0 };
    unsigned m_index { UINT_MAX };
    ConstraintVolatility m_volatility;
    ConstraintConcurrency m_concurrency;
    ConstraintParallelism m_parallelism;
    Lock m_lock;
};

} // namespace JSC

