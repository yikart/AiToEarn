/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "MediaPlayerEnums.h"

namespace WebCore {

class HTMLMediaElementEnums : public MediaPlayerEnums {
public:
    using MediaPlayerEnums::VideoFullscreenMode;

    enum ReadyState { HAVE_NOTHING, HAVE_METADATA, HAVE_CURRENT_DATA, HAVE_FUTURE_DATA, HAVE_ENOUGH_DATA };
    enum NetworkState { NETWORK_EMPTY, NETWORK_IDLE, NETWORK_LOADING, NETWORK_NO_SOURCE };
    enum TextTrackVisibilityCheckType { CheckTextTrackVisibility, AssumeTextTrackVisibilityChanged };
    enum InvalidURLAction { DoNothing, Complain };

    typedef enum {
        NoSeek,
        Fast,
        Precise
    } SeekType;
};

String convertEnumerationToString(HTMLMediaElementEnums::ReadyState);
String convertEnumerationToString(HTMLMediaElementEnums::NetworkState);
String convertEnumerationToString(HTMLMediaElementEnums::TextTrackVisibilityCheckType);

} // namespace WebCore

namespace WTF {

template<typename Type>
struct LogArgument;

template <>
struct LogArgument<WebCore::HTMLMediaElementEnums::ReadyState> {
    static String toString(const WebCore::HTMLMediaElementEnums::ReadyState state)
    {
        return convertEnumerationToString(state);
    }
};

template <>
struct LogArgument<WebCore::HTMLMediaElementEnums::NetworkState> {
    static String toString(const WebCore::HTMLMediaElementEnums::NetworkState state)
    {
        return convertEnumerationToString(state);
    }
};

template <>
struct LogArgument<WebCore::HTMLMediaElementEnums::TextTrackVisibilityCheckType> {
    static String toString(const WebCore::HTMLMediaElementEnums::TextTrackVisibilityCheckType type)
    {
        return convertEnumerationToString(type);
    }
};

}; // namespace WTF

