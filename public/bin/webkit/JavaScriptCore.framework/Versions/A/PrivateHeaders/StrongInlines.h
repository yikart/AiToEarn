/*
 * Copyright (C) 2011-2024 Apple Inc. All rights reserved.
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

#include "JSCJSValueInlines.h"
#include "VM.h"

#if ENABLE(REFTRACKER)
#include "InitializeThreading.h"
#endif

namespace JSC {

template <typename T, ShouldStrongDestructorGrabLock shouldStrongDestructorGrabLock>
inline Strong<T, shouldStrongDestructorGrabLock>::Strong(VM& vm, ExternalType value)
    : Handle<T>(vm.heap.handleSet()->allocate())
{
    set(value);
}

template <typename T, ShouldStrongDestructorGrabLock shouldStrongDestructorGrabLock>
inline Strong<T, shouldStrongDestructorGrabLock>::Strong(VM& vm, Handle<T> handle)
    : Handle<T>(vm.heap.handleSet()->allocate())
{
    set(handle.get());
}

template <typename T, ShouldStrongDestructorGrabLock shouldStrongDestructorGrabLock>
inline void Strong<T, shouldStrongDestructorGrabLock>::set(VM& vm, ExternalType value)
{
    if (!slot())
        setSlot(vm.heap.handleSet()->allocate());
    set(value);
}

#if ENABLE(REFTRACKER)
inline void initializeSystemForStrongRefTracker()
{
    static std::once_flag onceFlag;
    std::call_once(onceFlag, [] {
        WTF::initializeMainThread();
        JSC::initialize();
    });
}
#endif // ENABLE(REFTRACKER)

} // namespace JSC
