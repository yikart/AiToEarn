/*
 * Copyright (C) 2010 Apple Inc. All Rights Reserved.
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

#if PLATFORM(IOS_FAMILY)

#include "SQLiteDatabaseTrackerClient.h"
#include <pal/HysteresisActivity.h>
#include <wtf/Forward.h>
#include <wtf/Noncopyable.h>

namespace WebCore {

class WebSQLiteDatabaseTrackerClient final : public SQLiteDatabaseTrackerClient {
    WTF_MAKE_NONCOPYABLE(WebSQLiteDatabaseTrackerClient);
public:
    WEBCORE_EXPORT static WebSQLiteDatabaseTrackerClient& sharedWebSQLiteDatabaseTrackerClient();

    void willBeginFirstTransaction() final;
    void didFinishLastTransaction() final;

private:
    friend class NeverDestroyed<WebSQLiteDatabaseTrackerClient>;
    WebSQLiteDatabaseTrackerClient();
    virtual ~WebSQLiteDatabaseTrackerClient();

    void hysteresisUpdated(PAL::HysteresisState);

    PAL::HysteresisActivity m_hysteresis;
};

}

#endif
