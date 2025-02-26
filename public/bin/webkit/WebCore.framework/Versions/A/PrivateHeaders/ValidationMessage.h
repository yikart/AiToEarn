/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "Timer.h"
#include <memory>
#include <wtf/Noncopyable.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class WeakPtrImplWithEventTargetData;
class HTMLElement;
class Node;
class ValidationMessageClient;

// FIXME: We should remove the code for !validationMessageClient() when all
// ports supporting interactive validation switch to ValidationMessageClient.
class ValidationMessage : public RefCountedAndCanMakeWeakPtr<ValidationMessage> {
    WTF_MAKE_TZONE_ALLOCATED(ValidationMessage);
    WTF_MAKE_NONCOPYABLE(ValidationMessage);
public:
    static Ref<ValidationMessage> create(HTMLElement&);
    ~ValidationMessage();

    void updateValidationMessage(HTMLElement&, const String&);
    void requestToHideMessage();
    bool isVisible() const;
    bool shadowTreeContains(const Node&) const;
    void adjustBubblePosition();

private:
    explicit ValidationMessage(HTMLElement&);

    ValidationMessageClient* validationMessageClient() const;
    void setMessage(const String&);
    void setMessageDOMAndStartTimer();
    void buildBubbleTree();
    void deleteBubbleTree();

    WeakPtr<HTMLElement, WeakPtrImplWithEventTargetData> m_element;
    String m_message;
    std::unique_ptr<Timer> m_timer;
    RefPtr<HTMLElement> m_bubble;
    RefPtr<HTMLElement> m_messageHeading;
    RefPtr<HTMLElement> m_messageBody;
};

} // namespace WebCore
