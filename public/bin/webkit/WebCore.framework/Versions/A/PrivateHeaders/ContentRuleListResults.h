/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_EXTENSIONS)

#include "ContentExtensionActions.h"
#include <wtf/KeyValuePair.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {
    
struct ContentRuleListResults {
    struct Result {
        bool blockedLoad { false };
        bool madeHTTPS { false };
        bool blockedCookies { false };
        bool modifiedHeaders { false };
        bool redirected { false };
        Vector<String> notifications;
        
        bool shouldNotifyApplication() const
        {
            return blockedLoad
                || madeHTTPS
                || blockedCookies
                || modifiedHeaders
                || redirected
                || !notifications.isEmpty();
        }
    };
    struct Summary {
        bool blockedLoad { false };
        bool madeHTTPS { false };
        bool blockedCookies { false };
        bool hasNotifications { false };
        // Remaining fields currently aren't serialized as they aren't required by _WKContentRuleListAction
        Vector<ContentExtensions::ModifyHeadersAction> modifyHeadersActions { };
        Vector<std::pair<ContentExtensions::RedirectAction, URL>> redirectActions { };
    };
    using ContentRuleListIdentifier = String;

    Summary summary;
    Vector<std::pair<ContentRuleListIdentifier, Result>> results;
    
    bool shouldNotifyApplication() const
    {
        return summary.blockedLoad
            || summary.madeHTTPS
            || summary.blockedCookies
            || !summary.modifyHeadersActions.isEmpty()
            || !summary.redirectActions.isEmpty()
            || summary.hasNotifications;
    }
};

}

#endif // ENABLE(CONTENT_EXTENSIONS)
