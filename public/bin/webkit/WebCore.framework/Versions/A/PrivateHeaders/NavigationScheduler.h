/*
 * Copyright (C) 2006-2017 Apple Inc. All rights reserved.
 * Copyright (C) 2008, 2009 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
 * Copyright (C) 2009 Adam Barth. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FrameLoaderTypes.h"
#include "LoaderMalloc.h"
#include "Timer.h"
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/WeakRef.h>

namespace WebCore {

class Document;
class FormSubmission;
class Frame;
class LocalFrame;
class ScheduledNavigation;
class SecurityOrigin;

enum class NewLoadInProgress : bool { No, Yes };
enum class ScheduleLocationChangeResult : uint8_t { Stopped, Completed, Started };
enum class ScheduleHistoryNavigationResult : bool { Completed, Aborted };

class NavigationScheduler final {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
public:
    explicit NavigationScheduler(Frame&);
    ~NavigationScheduler();

    void ref() const;
    void deref() const;

    bool redirectScheduledDuringLoad();
    bool locationChangePending();

    void scheduleRedirect(Document& initiatingDocument, double delay, const URL&, IsMetaRefresh);
    void scheduleLocationChange(Document& initiatingDocument, SecurityOrigin&, const URL&, const String& referrer, LockHistory = LockHistory::Yes, LockBackForwardList = LockBackForwardList::Yes, NavigationHistoryBehavior historyHandling = NavigationHistoryBehavior::Auto, CompletionHandler<void(ScheduleLocationChangeResult)>&& = [] (ScheduleLocationChangeResult) { });
    void scheduleFormSubmission(Ref<FormSubmission>&&);
    void scheduleRefresh(Document& initiatingDocument);
    void scheduleHistoryNavigation(int steps);
    void scheduleHistoryNavigationByKey(const String&key, CompletionHandler<void(ScheduleHistoryNavigationResult)>&&);
    void schedulePageBlock(Document& originDocument);

    void startTimer();

    void cancel(NewLoadInProgress = NewLoadInProgress::No);
    void clear();

    bool hasQueuedNavigation() const;

private:
    bool shouldScheduleNavigation() const;
    bool shouldScheduleNavigation(const URL&) const;

    void timerFired();
    void schedule(std::unique_ptr<ScheduledNavigation>);
    Ref<Frame> protectedFrame() const;

    static LockBackForwardList mustLockBackForwardList(Frame& targetFrame);

    WeakRef<Frame> m_frame;
    Timer m_timer;
    std::unique_ptr<ScheduledNavigation> m_redirect;
};

} // namespace WebCore
