/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#ifndef UserActivity_h
#define UserActivity_h

#include <pal/HysteresisActivity.h>

#if HAVE(NS_ACTIVITY)
#include <objc/objc.h>
#include <wtf/RetainPtr.h>
#include <wtf/RunLoop.h>
OBJC_CLASS NSString;
#endif

namespace WebCore {

// The UserActivity type is used to indicate to the operating system that
// a user initiated or visible action is taking place, and as such that
// resources should be allocated to the process accordingly.
class UserActivity : public PAL::HysteresisActivity {
public:
    class Impl {
    public:
        explicit Impl(ASCIILiteral description);

        void beginActivity();
        void endActivity();

#if HAVE(NS_ACTIVITY)
    private:
        RetainPtr<id> m_activity;
        RetainPtr<NSString> m_description;
#endif
    };

    WEBCORE_EXPORT explicit UserActivity(ASCIILiteral);

private:
    void hysteresisUpdated(PAL::HysteresisState);

    Impl m_impl;
};

} // namespace WebCore

using WebCore::UserActivity;

#endif // UserActivity_h
