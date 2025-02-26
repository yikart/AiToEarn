/*
 * Copyright (C) 2014-2021 Apple Inc. All rights reserved.
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

#include "DeferrableTask.h"
#include "PlatformMediaSession.h"
#include <wtf/AbstractRefCounted.h>

namespace WebCore {

class RemoteCommandListenerClient {
public:
    virtual ~RemoteCommandListenerClient() = default;
    virtual void didReceiveRemoteControlCommand(PlatformMediaSession::RemoteControlCommandType, const PlatformMediaSession::RemoteCommandArgument&) = 0;
};

class WEBCORE_EXPORT RemoteCommandListener : public AbstractRefCounted {
public:
    static RefPtr<RemoteCommandListener> create(RemoteCommandListenerClient&);
    RemoteCommandListener(RemoteCommandListenerClient&);
    virtual ~RemoteCommandListener();

    using CreationFunction = Function<RefPtr<RemoteCommandListener>(RemoteCommandListenerClient&)>;
    static void setCreationFunction(CreationFunction&&);
    static void resetCreationFunction();

    void addSupportedCommand(PlatformMediaSession::RemoteControlCommandType);
    void removeSupportedCommand(PlatformMediaSession::RemoteControlCommandType);

    using RemoteCommandsSet = HashSet<PlatformMediaSession::RemoteControlCommandType, IntHash<PlatformMediaSession::RemoteControlCommandType>, WTF::StrongEnumHashTraits<PlatformMediaSession::RemoteControlCommandType>>;
    void setSupportedCommands(const RemoteCommandsSet&);
    const RemoteCommandsSet& supportedCommands() const;

    virtual void updateSupportedCommands();
    void scheduleSupportedCommandsUpdate();

    void setSupportsSeeking(bool);
    bool supportsSeeking() const;

    RemoteCommandListenerClient& client() const { return m_client; }

private:
    RemoteCommandListenerClient& m_client;
    RemoteCommandsSet m_supportedCommands;
    MainThreadDeferrableTask m_updateCommandsTask;
    bool m_supportsSeeking { false };
};

}
