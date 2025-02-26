/*
 * Copyright (C) 2003-2020 Apple Inc.  All rights reserved.
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

#include <wtf/Assertions.h>
#include <wtf/Forward.h>

#if __has_include("WebCoreLogDefinitions.h")
#include "WebCoreLogDefinitions.h"
#endif

#define COMMA() ,
#define OPTIONAL_ARGS(...) __VA_OPT__(COMMA()) __VA_ARGS__

#if ENABLE(LOGD_BLOCKING_IN_WEBCONTENT)
#include "LogClient.h"

#define RELEASE_LOG_FORWARDABLE(category, logMessage, ...) do { \
    if (auto& client = logClient()) \
        client->logMessage(__VA_ARGS__); \
    else \
        RELEASE_LOG(category, MESSAGE_##logMessage OPTIONAL_ARGS(__VA_ARGS__)); \
} while (0)

#define RELEASE_LOG_INFO_FORWARDABLE(category, logMessage, ...) do { \
    if (auto& client = logClient()) \
        client->logMessage(__VA_ARGS__); \
    else \
        RELEASE_LOG_INFO(category, MESSAGE_##logMessage OPTIONAL_ARGS(__VA_ARGS__)); \
} while (0)

#define RELEASE_LOG_ERROR_FORWARDABLE(category, logMessage, ...) do { \
    if (auto& client = logClient()) \
        client->logMessage(__VA_ARGS__); \
    else \
        RELEASE_LOG_ERROR(category, MESSAGE_##logMessage OPTIONAL_ARGS(__VA_ARGS__)); \
} while (0)

#define RELEASE_LOG_FAULT_FORWARDABLE(category, logMessage, ...) do { \
    if (auto& client = logClient()) \
        client->logMessage(__VA_ARGS__); \
    else \
        RELEASE_LOG_FAULT(category, MESSAGE_##logMessage OPTIONAL_ARGS(__VA_ARGS__)); \
} while (0)
#else
#define RELEASE_LOG_FORWARDABLE(category, logMessage, ...) RELEASE_LOG(category, MESSAGE_##logMessage OPTIONAL_ARGS(__VA_ARGS__))
#define RELEASE_LOG_INFO_FORWARDABLE(category, logMessage, ...) RELEASE_LOG_INFO(category, MESSAGE_##logMessage OPTIONAL_ARGS(__VA_ARGS__))
#define RELEASE_LOG_ERROR_FORWARDABLE(category, logMessage, ...) RELEASE_LOG_ERROR(category, MESSAGE_##logMessage OPTIONAL_ARGS(__VA_ARGS__))
#define RELEASE_LOG_FAULT_FORWARDABLE(category, logMessage, ...) RELEASE_LOG_FAULT(category, MESSAGE_##logMessage OPTIONAL_ARGS(__VA_ARGS__))
#endif // ENABLE(LOGD_BLOCKING_IN_WEBCONTENT)

namespace WebCore {

#if !LOG_DISABLED || !RELEASE_LOG_DISABLED

#ifndef LOG_CHANNEL_PREFIX
#define LOG_CHANNEL_PREFIX Log
#endif

#define WEBCORE_LOG_CHANNELS(M) \
    M(Accessibility) \
    M(ActivityState) \
    M(Animations) \
    M(AppHighlights) \
    M(ApplePay) \
    M(Archives) \
    M(BackForwardCache) \
    M(Calc) \
    M(ClipRects) \
    M(Compositing) \
    M(CompositingOverlap) \
    M(ContentFiltering) \
    M(ContentObservation) \
    M(Crypto) \
    M(DatabaseTracker) \
    M(DisplayLink) \
    M(DisplayLists) \
    M(DragAndDrop) \
    M(DOMTimers) \
    M(Editing) \
    M(EME) \
    M(Events) \
    M(EventLoop) \
    M(EventRegions) \
    M(FileAPI) \
    M(Filters) \
    M(FingerprintingMitigation) \
    M(Fonts) \
    M(Frames) \
    M(FTP) \
    M(Fullscreen) \
    M(Gamepad) \
    M(HID) \
    M(History) \
    M(IOSurface) \
    M(IconDatabase) \
    M(Images) \
    M(IndexedDB) \
    M(IndexedDBOperations) \
    M(Inspector) \
    M(IntersectionObserver) \
    M(Layers) \
    M(Layout) \
    M(LazyLoading) \
    M(FormattingContextLayout) \
    M(Loading) \
    M(Media) \
    M(MediaCaptureSamples) \
    M(MediaQueries) \
    M(MediaSource) \
    M(MediaStream) \
    M(MediaSourceSamples) \
    M(MemoryPressure) \
    M(MessagePorts) \
    M(ModelElement) \
    M(NativePromise) \
    M(Network) \
    M(NotYetImplemented) \
    M(OverlayScrollbars) \
    M(PerformanceLogging) \
    M(PlatformLeaks) \
    M(Plugins) \
    M(PopupBlocking) \
    M(Printing) \
    M(PrivateClickMeasurement) \
    M(Process) \
    M(Progress) \
    M(Push) \
    M(RemoteInspector) \
    M(RequestAnimationFrame) \
    M(ResizeObserver) \
    M(ResourceLoading) \
    M(ResourceLoadObserver) \
    M(ResourceLoadStatistics) \
    M(ScrollAnimations) \
    M(ScrollAnchoring) \
    M(ScrollSnap) \
    M(Scrolling) \
    M(ScrollingTree) \
    M(ScrollLatching) \
    M(Selection) \
    M(Services) \
    M(ServiceWorker) \
    M(SharedWorker) \
    M(SpellingAndGrammar) \
    M(SQLDatabase) \
    M(Storage) \
    M(StorageAPI) \
    M(Style) \
    M(StyleSheets) \
    M(SVG) \
    M(TextAutosizing) \
    M(TextDecoding) \
    M(TextFragment) \
    M(TextManipulation) \
    M(TextShaping) \
    M(Tiling) \
    M(Threading) \
    M(WritingTools) \
    M(URLParser) \
    M(Viewports) \
    M(ViewTransitions) \
    M(VirtualMemory) \
    M(WebAudio) \
    M(WebGL) \
    M(WebRTC) \
    M(WebRTCStats) \
    M(Worker) \
    M(XR) \
    M(WheelEventTestMonitor) \

#undef DECLARE_LOG_CHANNEL
#define DECLARE_LOG_CHANNEL(name) \
    WEBCORE_EXPORT extern WTFLogChannel JOIN_LOG_CHANNEL_WITH_PREFIX(LOG_CHANNEL_PREFIX, name);

WEBCORE_LOG_CHANNELS(DECLARE_LOG_CHANNEL)

#endif // !LOG_DISABLED || !RELEASE_LOG_DISABLED

} // namespace WebCore
