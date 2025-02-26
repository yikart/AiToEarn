/*
 * Copyright (C) 2016-2021 Apple Inc. All rights reserved.
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

#include "Heap.h"

namespace JSC {

class JSCell;

// Note that if all you're doing is calling LazyProperty::get(), it's completely safe to bitcast
// this LazyProperty<JSCell, JSCell>.
template<typename OwnerType, typename ElementType>
class LazyProperty {
public:
    struct Initializer {
        Initializer(OwnerType* owner, LazyProperty& property)
            : vm(Heap::heap(owner)->vm())
            , owner(owner)
            , property(property)
        {
        }
        
        void set(ElementType* value) const;

        VM& vm;
        OwnerType* owner;
        LazyProperty& property;
    };

private:
    typedef ElementType* (*FuncType)(const Initializer&);

public:
    LazyProperty()
    {
    }

    // Tell the property to run the given callback next time someone tries to get the value
    // using get(). The passed callback must be stateless. For example:
    //
    //     property.initLater(
    //         [] (const LazyProperty<Foo, Bar>::Initializer& init) {
    //             init.set(...things...);
    //         });
    //
    // This method is always inlineable and should always compile to a store of a constant
    // pointer no matter how complicated the callback is.
    template<typename Func>
    void initLater(const Func&);

    // This lazily initializes the property. Note that this gracefully supports recursive calls.
    // If this gets called while the property is being initialized, it will simply return null.
    ElementType* get(const OwnerType* owner) const
    {
        ASSERT(!isCompilationThread());
        return getInitializedOnMainThread(owner);
    }
    
    ElementType* getConcurrently() const
    {
        uintptr_t pointer = m_pointer;
        if (pointer & lazyTag)
            return nullptr;
        return std::bit_cast<ElementType*>(pointer);
    }

    bool isInitialized() const { return !(m_pointer & lazyTag); }

    ElementType* getInitializedOnMainThread(const OwnerType* owner) const
    {
        if (UNLIKELY(m_pointer & lazyTag)) {
            ASSERT(!isCompilationThread());
            FuncType func = *std::bit_cast<FuncType*>(m_pointer & ~(lazyTag | initializingTag));
            return func(Initializer(const_cast<OwnerType*>(owner), *const_cast<LazyProperty*>(this)));
        }
        return std::bit_cast<ElementType*>(m_pointer);
    }
    
    void setMayBeNull(VM&, const OwnerType* owner, ElementType*);
    void set(VM&, const OwnerType* owner, ElementType*);
    
    template<typename Visitor> void visit(Visitor&);
    
    void dump(PrintStream&) const;
    
private:
    template<typename Func>
    static ElementType* callFunc(const Initializer&);
    
    static const uintptr_t lazyTag = 1;
    static const uintptr_t initializingTag = 2;
    
    uintptr_t m_pointer { 0 };
};

// It's valid to bitcast any LazyProperty to LazyCellProperty if you're just going to call get()
// or getConcurrently().
typedef LazyProperty<JSCell, JSCell> LazyCellProperty;

} // namespace JSC
