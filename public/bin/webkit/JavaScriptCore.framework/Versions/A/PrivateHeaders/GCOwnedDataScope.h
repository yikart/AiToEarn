/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "EnsureStillAliveHere.h"

namespace JSC {

class JSCell;

// This class is used return data owned by a JSCell. Consider:
// int foo(JSString* jsString)
// {
//     String& string = jsString->value(globalObject);
//     // Do something that triggers a GC (e.g. any object allocation)
//     return string.length();
// }
// The C++ compiler is technically free to "drop" the last reference to jsString
// after we call value. Since our GC relies on live C++ values still existing on
// the stack when we trigger a GC we could collect jsString freeing string and
// causing a UAF. This class helps avoid that problem by forcing the C++ compiler
// to keep a reference to the owner GCed object of our data while being as
// unobtrusive as possible. That said there are a few caveats for callers:
//   1) **NEVER** do:
//          Data& data = foo->getData();
//      or:
//          Data* data = foo->getData();
//      this will **NOT** prevent the GC from collecting foo before data goes
//      out of scope.
//
//   2) The preferred way to call a function returning a GCOwnedDataScope is:
//          auto data = foo->getData();
//      this will ensure foo exists long enough prevent a GC before data goes
//      out of scope.
//
//
//   3) It's ok to bind to / return a retained value:
//          Data data = foo->getData();
//      or:
//          return foo->getData();
//      These aren't ideal as they trigger a retain and maybe release on data
//      but this can't be avoided in some cases.

template<typename T>
struct GCOwnedDataScope {
    GCOwnedDataScope(const JSCell* cell, T value)
        : owner(cell)
        , data(value)
    { }

    ~GCOwnedDataScope() { ensureStillAliveHere(owner); }

    operator const T() const { return data; }
    operator T() { return data; }

    std::remove_reference_t<T>* operator->() requires (!std::is_pointer_v<T>) { return &data; }
    const std::remove_reference_t<T>* operator->() const requires (!std::is_pointer_v<T>) { return &data; }

    T operator->() requires (std::is_pointer_v<T>) { return data; }
    const T operator->() const requires (std::is_pointer_v<T>) { return data; }

    auto operator[](unsigned index) const { return data[index]; }

    // Convenience conversion for String -> StringView
    operator StringView() const requires (std::is_same_v<std::decay_t<T>, String>) { return data; }

    const JSCell* owner;
    T data;
};

}
