/*
 * Copyright (C) 2006-2020 Apple Inc. All rights reserved.
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

#include "ElementContext.h"
#include "IntRect.h"
#include "ProcessIdentifier.h"

namespace WebCore {

enum class FrameState : uint8_t {
    Provisional,
    // This state indicates we are ready to commit to a page,
    // which means the view will transition to use the new data source.
    CommittedPage,
    Complete
};

enum class PolicyAction : uint8_t {
    Use,
    Download,
    Ignore,
    LoadWillContinueInAnotherProcess
};

enum class ReloadOption : uint8_t {
    ExpiredOnly = 1 << 0,
    FromOrigin  = 1 << 1,
    DisableContentBlockers = 1 << 2,
};

enum class FrameLoadType : uint8_t {
    Standard,
    Back,
    Forward,
    IndexedBackForward, // a multi-item hop in the backforward list
    Reload,
    Same, // user loads same URL again (but not reload button)
    RedirectWithLockedBackForwardList, // FIXME: Merge "lockBackForwardList", "lockHistory", "quickRedirect" and "clientRedirect" into a single concept of redirect.
    Replace,
    ReloadFromOrigin,
    ReloadExpiredOnly
};

enum class IsMetaRefresh : bool { No, Yes };
enum class WillContinueLoading : bool { No, Yes };
enum class WillInternallyHandleFailure : bool { No, Yes };

enum class ShouldContinuePolicyCheck : bool { No, Yes };

enum class NewFrameOpenerPolicy : uint8_t {
    Suppress,
    Allow
};

enum class NavigationType : uint8_t {
    LinkClicked,
    FormSubmitted,
    BackForward,
    Reload,
    FormResubmitted,
    Other
};

enum class NavigationHistoryBehavior : uint8_t {
    Auto,
    Push,
    Replace,
    Reload // Internal, not part of the specification
};

enum class ShouldOpenExternalURLsPolicy : uint8_t {
    ShouldNotAllow,
    ShouldAllowExternalSchemesButNotAppLinks,
    ShouldAllow,
};

enum class InitiatedByMainFrame : uint8_t {
    Yes,
    Unknown,
};

enum class ClearProvisionalItem : bool { No, Yes };

enum class StopLoadingPolicy {
    PreventDuringUnloadEvents,
    AlwaysStopLoading
};

enum class ObjectContentType : uint8_t {
    None,
    Image,
    Frame,
    PlugIn,
};

enum class UnloadEventPolicy {
    None,
    UnloadOnly,
    UnloadAndPageHide
};

enum class BrowsingContextGroupSwitchDecision : uint8_t {
    StayInGroup,
    NewSharedGroup,
    NewIsolatedGroup,
};

// Passed to FrameLoader::urlSelected() and ScriptController::executeIfJavaScriptURL()
// to control whether, in the case of a JavaScript URL, executeIfJavaScriptURL() should
// replace the document. It is a FIXME to eliminate this extra parameter from
// executeIfJavaScriptURL(), in which case this enum can go away.
enum ShouldReplaceDocumentIfJavaScriptURL {
    ReplaceDocumentIfJavaScriptURL,
    DoNotReplaceDocumentIfJavaScriptURL
};

enum class IsMainResourceLoad : bool { No, Yes };
enum class LockHistory : bool { No, Yes };
enum class LockBackForwardList : bool { No, Yes };
enum class AllowNavigationToInvalidURL : bool { No, Yes };
enum class HasInsecureContent : bool { No, Yes };
enum class LoadWillContinueInAnotherProcess : bool { No, Yes };

// FIXME: This should move to somewhere else. It no longer is related to frame loading.
struct SystemPreviewInfo {
    ElementContext element;

    IntRect previewRect;
    bool isPreview { false };
};

enum class LoadCompletionType : bool {
    Finish,
    Cancel
};

enum class AllowsContentJavaScript : bool {
    No,
    Yes,
};

enum class WindowProxyProperty : uint8_t {
    Other = 1 << 0,
    Closed = 1 << 1,
    PostMessage = 1 << 2,
};

} // namespace WebCore
