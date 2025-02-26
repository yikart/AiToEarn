/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include <wtf/Function.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WorkQueue.h>
#include <wtf/text/WTFString.h>

#if USE(COCOA_EVENT_LOOP)
#include <dispatch/dispatch.h>
#include <wtf/OSObjectPtr.h>
#endif

#if USE(GLIB)
#include <gio/gio.h>
#include <wtf/glib/GRefPtr.h>
#endif

namespace WebCore {

class FileMonitor {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FileMonitor, WEBCORE_EXPORT);
public:
    enum class FileChangeType { Modification, Removal };

    WEBCORE_EXPORT FileMonitor(const String&, Ref<WorkQueue>&& handlerQueue, Function<void(FileChangeType)>&& modificationHandler);
    WEBCORE_EXPORT ~FileMonitor();

private:
#if USE(COCOA_EVENT_LOOP)
    OSObjectPtr<dispatch_source_t> m_platformMonitor;
#endif
#if USE(GLIB)
    static void fileChangedCallback(GFileMonitor*, GFile*, GFile*, GFileMonitorEvent, FileMonitor*);
    void didChange(FileChangeType);
    void cancel();
    Ref<WorkQueue> m_handlerQueue;
    Function<void(FileChangeType)> m_modificationHandler;
    GRefPtr<GFileMonitor> m_platformMonitor;
#endif
};

} // namespace WebCore
