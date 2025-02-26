/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
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

#include "JSScope.h"
#include "VM.h"

namespace JSC {

template<typename JSCellType>
class InferredValue {
    WTF_MAKE_NONCOPYABLE(InferredValue);
    WTF_MAKE_NONMOVABLE(InferredValue);
public:
    // For the purpose of deciding whether or not to watch this variable, you only need
    // to inspect inferredValue(). If this returns something other than the empty
    // value, then it means that at all future safepoints, this watchpoint set will be
    // in one of these states:
    //
    //    IsWatched: in this case, the variable's value must still be the
    //        inferredValue.
    //
    //    IsInvalidated: in this case the variable's value may be anything but you'll
    //        either notice that it's invalidated and not install the watchpoint, or
    //        you will have been notified that the watchpoint was fired.
    JSCellType* inferredValue()
    {
        uintptr_t data = m_data;
        if (isFat(data))
            return fat(data)->inferredValue();
        return std::bit_cast<JSCellType*>(data & ValueMask);
    }

    explicit InferredValue()
        : m_data(encodeState(ClearWatchpoint))
    {
        ASSERT(inferredValue() == nullptr);
    }

    ~InferredValue()
    {
        if (isThin())
            return;
        freeFat();
    }

    // It is safe to call this from another thread. It may return a prior state,
    // but that should be fine since you should only perform actions based on the
    // state if you also add a watchpoint.
    WatchpointState state() const
    {
        uintptr_t data = m_data;
        if (isFat(data))
            return fat(data)->state();
        return decodeState(data);
    }

    // It is safe to call this from another thread. It may return false
    // even if the set actually had been invalidated, but that ought to happen
    // only in the case of races, and should be rare.
    bool hasBeenInvalidated() const
    {
        return state() == IsInvalidated;
    }
    
    // Like hasBeenInvalidated(), may be called from another thread.
    bool isStillValid() const
    {
        return !hasBeenInvalidated();
    }
    
    void add(Watchpoint*);
    
    void invalidate(VM& vm, const FireDetail& detail)
    {
        if (isFat())
            fat()->invalidate(vm, detail);
        else
            m_data = encodeState(IsInvalidated);
    }
    
    bool isBeingWatched() const
    {
        if (isFat())
            return fat()->isBeingWatched();
        return false;
    }

    void notifyWrite(VM& vm, JSCell* owner, JSCellType* value, const FireDetail& detail)
    {
        if (LIKELY(state() == IsInvalidated))
            return;
        notifyWriteSlow(vm, owner, value, detail);
    }
    
    void notifyWrite(VM& vm, JSCell* owner, JSCellType* value, const char* reason)
    {
        if (LIKELY(state() == IsInvalidated))
            return;
        notifyWriteSlow(vm, owner, value, reason);
    }
    
    void finalizeUnconditionally(VM&, CollectionScope);

private:
    class InferredValueWatchpointSet final : public WatchpointSet {
    public:
        InferredValueWatchpointSet(WatchpointState state, JSCellType* value)
            : WatchpointSet(state)
            , m_value(value)
        {
        }

        JSCellType* inferredValue() const { return m_value; }

        void invalidate(VM& vm, const FireDetail& detail)
        {
            m_value = nullptr;
            WatchpointSet::invalidate(vm, detail);
        }

        void notifyWriteSlow(VM&, JSCell* owner, JSCellType*, const FireDetail&);

    private:
        JSCellType* m_value;
    };

    static constexpr uintptr_t IsThinFlag        = 1;
    static constexpr uintptr_t StateMask         = 6;
    static constexpr uintptr_t StateShift        = 1;
    static constexpr uintptr_t ValueMask         = ~static_cast<uintptr_t>(IsThinFlag | StateMask);
    
    static bool isThin(uintptr_t data) { return data & IsThinFlag; }
    static bool isFat(uintptr_t data) { return !isThin(data); }
    
    static WatchpointState decodeState(uintptr_t data)
    {
        ASSERT(isThin(data));
        return static_cast<WatchpointState>((data & StateMask) >> StateShift);
    }
    
    static uintptr_t encodeState(WatchpointState state)
    {
        return (static_cast<uintptr_t>(state) << StateShift) | IsThinFlag;
    }
    
    bool isThin() const { return isThin(m_data); }
    bool isFat() const { return isFat(m_data); };
    
    static InferredValueWatchpointSet* fat(uintptr_t data)
    {
        return std::bit_cast<InferredValueWatchpointSet*>(data);
    }
    
    InferredValueWatchpointSet* fat()
    {
        ASSERT(isFat());
        return fat(m_data);
    }
    
    const InferredValueWatchpointSet* fat() const
    {
        ASSERT(isFat());
        return fat(m_data);
    }
    
    InferredValueWatchpointSet* inflate()
    {
        if (LIKELY(isFat()))
            return fat();
        return inflateSlow();
    }

    InferredValueWatchpointSet* inflateSlow();
    void freeFat();

    void notifyWriteSlow(VM&, JSCell* owner, JSCellType*, const FireDetail&);
    void notifyWriteSlow(VM&, JSCell* owner, JSCellType*, const char* reason);
    
    uintptr_t m_data;
};

template<typename JSCellType>
void InferredValue<JSCellType>::InferredValueWatchpointSet::notifyWriteSlow(VM& vm, JSCell* owner, JSCellType* value, const FireDetail& detail)
{
    switch (state()) {
    case ClearWatchpoint:
        m_value = value;
        vm.writeBarrier(owner, value);
        startWatching();
        return;

    case IsWatched:
        ASSERT(!!m_value);
        if (m_value == value)
            return;
        invalidate(vm, detail);
        return;

    case IsInvalidated:
        ASSERT_NOT_REACHED();
        return;
    }

    ASSERT_NOT_REACHED();
}

template<typename JSCellType>
void InferredValue<JSCellType>::notifyWriteSlow(VM& vm, JSCell* owner, JSCellType* value, const FireDetail& detail)
{
    uintptr_t data = m_data;
    if (isFat(data)) {
        fat(data)->notifyWriteSlow(vm, owner, value, detail);
        return;
    }

    switch (state()) {
    case ClearWatchpoint:
        ASSERT(decodeState(m_data) != IsInvalidated);
        m_data = (std::bit_cast<uintptr_t>(value) & ValueMask) | encodeState(IsWatched);
        vm.writeBarrier(owner, value);
        return;

    case IsWatched:
        ASSERT(!!inferredValue());
        if (inferredValue() == value)
            return;
        invalidate(vm, detail);
        return;

    case IsInvalidated:
        ASSERT_NOT_REACHED();
        return;
    }

    ASSERT_NOT_REACHED();
}

template<typename JSCellType>
void InferredValue<JSCellType>::notifyWriteSlow(VM& vm, JSCell* owner, JSCellType* value, const char* reason)
{
    notifyWriteSlow(vm, owner, value, StringFireDetail(reason));
}

template<typename JSCellType>
void InferredValue<JSCellType>::add(Watchpoint* watchpoint)
{
    inflate()->add(watchpoint);
}

template<typename JSCellType>
auto InferredValue<JSCellType>::inflateSlow() -> InferredValueWatchpointSet*
{
    ASSERT(isThin());
    ASSERT(!isCompilationThread());
    uintptr_t data = m_data;
    InferredValueWatchpointSet* fat = adoptRef(new InferredValueWatchpointSet(decodeState(m_data), std::bit_cast<JSCellType*>(data & ValueMask))).leakRef();
    WTF::storeStoreFence();
    m_data = std::bit_cast<uintptr_t>(fat);
    return fat;
}

template<typename JSCellType>
void InferredValue<JSCellType>::freeFat()
{
    ASSERT(isFat());
    fat()->deref();
}

} // namespace JSC
