/*
 * Copyright (C) 2019-2022 Apple Inc. All rights reserved.
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

#include "Integrity.h"
#include "JSCJSValue.h"
#include "StructureID.h"
#include "VM.h"
#include "VMInspector.h"
#include <wtf/Atomics.h>
#include <wtf/Gigacage.h>

namespace JSC {
namespace Integrity {

ALWAYS_INLINE bool Random::shouldAudit(VM& vm)
{
    // If auditing is enabled, then the top bit of m_triggerBits is always set
    // to 1 on reload. When this top bit reaches the bottom, it does not
    // indicate that we should trigger an audit but rather that we've shifted
    // out all the available trigger bits and hence, need to reload. Instead,
    // reloadAndCheckShouldAuditSlow() will return whether we actually need to
    // trigger an audit this turn.
    //
    // This function can be called concurrently from different threads and can
    // be racy. For that reason, we intentionally do not write back to
    // m_triggerBits if newTriggerBits is null. This ensures that if
    // Options::randomIntegrityAuditRate() is non-zero, then m_triggerBits will
    // always have at least 1 bit to trigger a reload.

    uint64_t newTriggerBits = m_triggerBits;
    bool shouldAudit = newTriggerBits & 1;
    newTriggerBits = newTriggerBits >> 1;
    if (LIKELY(!shouldAudit)) {
        m_triggerBits = newTriggerBits;
        return false;
    }

    if (!newTriggerBits)
        return reloadAndCheckShouldAuditSlow(vm);

    m_triggerBits = newTriggerBits;
    return true;
}

template<AuditLevel auditLevel>
ALWAYS_INLINE void auditCell(VM& vm, JSValue value)
{
    if constexpr (auditLevel == AuditLevel::None)
        return;

    if (value.isCell())
        auditCell<auditLevel>(vm, value.asCell());
}

ALWAYS_INLINE void auditCellMinimally(VM& vm, JSCell* cell)
{
    if (UNLIKELY(Gigacage::contains(cell)))
        auditCellMinimallySlow(vm, cell);
}

ALWAYS_INLINE void auditCellRandomly(VM& vm, JSCell* cell)
{
    if (UNLIKELY(vm.integrityRandom().shouldAudit(vm)))
        auditCellFully(vm, cell);
}

ALWAYS_INLINE void auditCellFully(VM& vm, JSCell* cell)
{
#if USE(JSVALUE64)
    doAudit(vm, cell);
#else
    auditCellMinimally(vm, cell);
#endif
}

ALWAYS_INLINE void auditStructureID(StructureID structureID)
{
    UNUSED_PARAM(structureID);
#if CPU(ADDRESS64) && !ENABLE(STRUCTURE_ID_WITH_SHIFT)
    ASSERT(static_cast<uintptr_t>(structureID.bits()) <= structureHeapAddressSize + StructureID::nukedStructureIDBit);
#endif
#if ENABLE(EXTRA_INTEGRITY_CHECKS) || ASSERT_ENABLED
    Structure* structure = structureID.tryDecode();
    IA_ASSERT(structure, "structureID.bits 0x%x", structureID.bits());
    // structure should be pointing to readable memory. Force a read.
    WTF::opaque(*std::bit_cast<uintptr_t*>(structure));
#endif
}

#if USE(JSVALUE64)

JS_EXPORT_PRIVATE VM* doAuditSlow(VM*);

ALWAYS_INLINE VM* doAudit(VM* vm)
{
    if (UNLIKELY(!VMInspector::isValidVM(vm)))
        return doAuditSlow(vm);
    return vm;
}

#endif // USE(JSVALUE64)

} // namespace Integrity
} // namespace JSC
