/*
 * Copyright (C) 2018-2024 Apple Inc. All rights reserved.
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

#include "CallFrame.h"
#include "JSCalleeInlines.h"
#include "RegisterInlines.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

inline Register& CallFrame::r(VirtualRegister reg)
{
    if (reg.isConstant())
        return *reinterpret_cast<Register*>(&this->codeBlock()->constantRegister(reg));
    return this[reg.offset()];
}

inline Register& CallFrame::uncheckedR(VirtualRegister reg)
{
    ASSERT(!reg.isConstant());
    return this[reg.offset()];
}

inline JSValue CallFrame::guaranteedJSValueCallee() const
{
    ASSERT(!callee().isNativeCallee());
    return this[static_cast<int>(CallFrameSlot::callee)].jsValue();
}

inline JSObject* CallFrame::jsCallee() const
{
    ASSERT(!callee().isNativeCallee());
    return this[static_cast<int>(CallFrameSlot::callee)].object();
}

inline CodeBlock* CallFrame::codeBlock() const
{
    ASSERT(!callee().isNativeCallee());
    return this[static_cast<int>(CallFrameSlot::codeBlock)].Register::codeBlock();
}

inline SUPPRESS_ASAN CodeBlock* CallFrame::unsafeCodeBlock() const
{
    return this[static_cast<int>(CallFrameSlot::codeBlock)].Register::asanUnsafeCodeBlock();
}

inline JSGlobalObject* CallFrame::lexicalGlobalObject(VM& vm) const
{
    if (callee().isNativeCallee())
        return lexicalGlobalObjectFromNativeCallee(vm);
    return jsCallee()->globalObject();
}

inline JSCell* CallFrame::codeOwnerCell() const
{
    if (callee().isNativeCallee())
        return codeOwnerCellSlow();
    return codeBlock();
}

inline bool CallFrame::isPartiallyInitializedFrame() const
{
    if (callee().isNativeCallee())
        return false;
    return jsCallee() == jsCallee()->globalObject()->partiallyInitializedFrameCallee();
}

inline bool CallFrame::isNativeCalleeFrame() const
{
    return callee().isNativeCallee();
}

inline void CallFrame::setCallee(JSObject* callee)
{
    static_cast<Register*>(this)[static_cast<int>(CallFrameSlot::callee)] = callee;
}

inline void CallFrame::setCallee(NativeCallee* callee)
{
    reinterpret_cast<uint64_t*>(this)[static_cast<int>(CallFrameSlot::callee)] = CalleeBits::encodeNativeCallee(callee);
}

inline void CallFrame::setCodeBlock(CodeBlock* codeBlock)
{
    static_cast<Register*>(this)[static_cast<int>(CallFrameSlot::codeBlock)] = codeBlock;
}

inline void CallFrame::setScope(int scopeRegisterOffset, JSScope* scope)
{
    static_cast<Register*>(this)[scopeRegisterOffset] = scope;
}

inline JSScope* CallFrame::scope(int scopeRegisterOffset) const
{
    ASSERT(this[scopeRegisterOffset].Register::scope());
    return this[scopeRegisterOffset].Register::scope();
}

inline Register* CallFrame::topOfFrame()
{
    if (!codeBlock())
        return registers();
    return topOfFrameInternal();
}

SUPPRESS_ASAN ALWAYS_INLINE void CallFrame::setCallSiteIndex(CallSiteIndex callSiteIndex)
{
    this[static_cast<int>(CallFrameSlot::argumentCountIncludingThis)].tag() = callSiteIndex.bits();
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
