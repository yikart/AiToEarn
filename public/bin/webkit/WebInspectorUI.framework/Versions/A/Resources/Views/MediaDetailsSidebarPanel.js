/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

WI.MediaDetailsSidebarPanel = class MediaDetailsSidebarPanel extends WI.DOMDetailsSidebarPanel
{
    // Static

    static StyleClassName = "media";

    // Public

    constructor(delegate)
    {
        super("media-details", WI.UIString("Media"));

        this.#ui.sourceRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Source", "Source @ Media Sidebar", "Title for Source row in Media Sidebar"));
        this.#ui.viewportRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Viewport", "Viewport @ Media Sidebar", "Title for Viewport row in Media Sidebar"));
        this.#ui.framesRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Frames", "Frames @ Media Sidebar Frame Count", "Title for Frames row in Media Sidebar"));
        this.#ui.resolutionRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Resolution", "Resolution @ Media Sidebar", "Title for Resolution row in Media Sidebar"));
        this.#ui.videoFormatRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Video Format", "Video Format @ Media Sidebar", "Title for Video Format row in Media Sidebar"));
        this.#ui.audioFormatRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Audio Format", "Audio Format @ Media Sidebar", "Title for Audio Format row in Media Sidebar"));

        let generalGroup = new WI.DetailsSectionGroup([this.#ui.sourceRow, this.#ui.viewportRow, this.#ui.framesRow, this.#ui.resolutionRow, this.#ui.videoFormatRow, this.#ui.audioFormatRow]);
        this.#ui.generalSection = new WI.DetailsSection("media-details-general", WI.UIString("General", "General @ Media Sidebar", "Title for General Section in Media Sidebar"), [generalGroup]);

        this.#ui.videoCodecRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Video Codec", "Video Codec @ Media Sidebar", "Title for Video Codec row in Media Sidebar"));
        this.#ui.transferRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Transfer Function", "Transfer Function @ Media Sidebar", "Title for Transfer Function row in Media Sidebar"));
        this.#ui.primariesRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Color Primaries", "Color Primaries @ Media Sidebar", "Title for Color Primaries row in Media Sidebar"));
        this.#ui.matrixRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Matrix Coefficients", "Matrix Coefficients @ Media Sidebar", "Title for Matrix Coefficients row in Media Sidebar"));
        this.#ui.fullRangeRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Color Range", "Color Range @ Media Sidebar", "Title for Color Range row in Media Sidebar"));

        let videoGroup = new WI.DetailsSectionGroup([this.#ui.videoCodecRow, this.#ui.primariesRow, this.#ui.transferRow, this.#ui.matrixRow, this.#ui.fullRangeRow]);
        this.#ui.videoSection = new WI.DetailsSection("media-video-details", WI.UIString("Video Details", "Video Details @ Media Sidebar", "Title for Video Details section in Media Sidebar"), [videoGroup]);
        this.#ui.audioCodecRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Audio Codec", "Audio Codec @ Media Sidebar", "Title for Audio Codec row in Media Sidebar"));
        this.#ui.sampleRateRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Sample Rate", "Sample Rate @ Media Sidebar", "Title for Sample Rate row in Media Sidebar"));
        this.#ui.channelsRow = new WI.MediaDetailsSidebarPanel.#Row(WI.UIString("Channels", "Channels @ Media Sidebar", "Title for Channels row in Media Sidebar"));

        let audioGroup = new WI.DetailsSectionGroup([this.#ui.audioCodecRow, this.#ui.sampleRateRow, this.#ui.channelsRow]);
        this.#ui.audioSection = new WI.DetailsSection("media-audio-details", WI.UIString("Audio Details", "Audio Details @ Media Sidebar", "Title for Audio Details section in Media Sidebar"), [audioGroup]);
    }

    layout()
    {
        this.#ui.sourceRow.updateValue();
        this.#ui.viewportRow.updateValue();
        this.#ui.framesRow.updateValue();
        this.#ui.resolutionRow.updateValue();
        this.#ui.videoFormatRow.updateValue();
        this.#ui.audioFormatRow.updateValue();
        this.#ui.videoCodecRow.updateValue();
        this.#ui.transferRow.updateValue();
        this.#ui.primariesRow.updateValue();
        this.#ui.matrixRow.updateValue();
        this.#ui.fullRangeRow.updateValue();
        this.#ui.audioCodecRow.updateValue();
        this.#ui.sampleRateRow.updateValue();
        this.#ui.channelsRow.updateValue();
    }

    // Protected

    // DOMDetailsSidebarPanel Overrides

    supportsDOMNode(nodeToInspect)
    {
        return nodeToInspect.isMediaElement();
    }

    attached()
    {
        super.attached();
        this.#startUpdateTimer();
    }

    detached()
    {
        super.detached();
        this.#cancelUpdateTimer();
    }

    // View Overrides

    initialLayout()
    {
        super.initialLayout();

        this.element.appendChild(this.#ui.generalSection.element);
        this.element.appendChild(this.#ui.videoSection.element);
        this.element.appendChild(this.#ui.audioSection.element);
    }

    // Private

    static #Row = class MediaDetailsSectionSimpleRow extends WI.DetailsSectionSimpleRow
    {
        // Public

        set pendingValue(value)
        {
            this.#pendingValue = value;
            this.#dirty = true;
        }

        updateValue()
        {
            if (!this.#dirty)
                return;
            this.value = this.#pendingValue;
            this.#pendingValue = null;
            this.#dirty = false;
        }

        // Private

        #pendingValue = null;
        #dirty = null;
    };

    #values = {
        source: null,
        viewport: null,
        devicePixelRatio: null,
        quality: null,
        videoFormat: null,
        audioFormat: null,
        video: null,
        audio: null,
    };

    #ui = {
        sourceRow: null,
        viewportRow: null,
        framesRow: null,
        resolutionRow: null,
        videoFormatRow: null,
        audioFormatRow: null,
        generalSection: null,
        videoCodecRow: null,
        transferRow: null,
        primariesRow: null,
        matrixRow: null,
        fullRangeRow: null,
        videoSection: null,
        audioCodecRow: null,
        sampleRateRow: null,
        channelsRow: null,
        audioSection: null,
    };

    #updateTimer = null;
    #updateTimerInterval = 250;

    #startUpdateTimer()
    {
        this.#cancelUpdateTimer();
        this.#updateTimerFired();
    }

    #cancelUpdateTimer()
    {
        if (this.#updateTimer)
            clearTimeout(this.#updateTimer);
    }

    async #updateTimerFired()
    {
        if (!this.domNode)
            return;

        let stats = await this.domNode.getMediaStats();
        this.#setSource(stats.source);
        this.#setViewport(stats.viewport);
        this.#setDevicePixelRatio(stats.devicePixelRatio);
        this.#setQuality(stats.quality);
        this.#setVideoFormat(stats.video?.humanReadableCodecString);
        this.#setAudioFormat(stats.audio?.humanReadableCodecString);
        this.#setVideo(stats.video);
        this.#setAudio(stats.audio);

        if (this.isAttached)
            this.#updateTimer = setTimeout(() => this.#updateTimerFired(), this.#updateTimerInterval);
    }

    #setSource(source)
    {
        if (this.#values.source === source)
            return;

        this.#values.source = source;
        this.#ui.sourceRow.pendingValue = this.#values.source;
        this.needsLayout();
    }

    #setViewport(viewport)
    {
        if (Object.shallowEqual(this.#values.viewport, viewport))
            return;

        this.#values.viewport = viewport;
        this.#updateViewportRow();
    }

    #setDevicePixelRatio(devicePixelRatio)
    {
        if (this.#values.devicePixelRatio === devicePixelRatio)
            return;

        this.#values.devicePixelRatio = devicePixelRatio;
        this.#updateViewportRow();
    }

    #updateViewportRow()
    {
        this.#ui.viewportRow.pendingValue = WI.UIString("%dx%d (%dx)").format(this.#values.viewport?.width ?? 0, this.#values.viewport?.height ?? 0, this.#values.devicePixelRatio ?? 1);
        this.needsLayout();
    }

    #setQuality(quality)
    {
        if (Object.shallowEqual(this.#values.quality, quality))
            return;

        this.#values.quality = quality;
        let formatString = WI.UIString("%d dropped of %d", "Dropped Frame Format @ Media Sidebar", "Format string for Dropped Frame count in Media Sidebar");
        this.#ui.framesRow.pendingValue = formatString.format(quality?.droppedVideoFrames ?? 0, quality?.totalVideoFrames ?? 0);
        this.needsLayout();
    }

    #setVideoFormat(videoFormat)
    {
        if (this.#values.videoFormat === videoFormat)
            return;

        this.#values.videoFormat = videoFormat;
        this.#ui.videoFormatRow.pendingValue = videoFormat;
        this.needsLayout();
    }

    #setAudioFormat(audioFormat)
    {
        if (this.#values.audioFormat === audioFormat)
            return;

        this.#values.audioFormat = audioFormat;
        this.#ui.audioFormatRow.pendingValue = audioFormat;
        this.needsLayout();
    }

    #setVideo(video)
    {
        if (this.#values.video === video)
            return;

        if (this.#values.video?.width === video?.width
            && this.#values.video?.height === video?.height
            && this.#values.video?.framerate === video?.framerate
            && this.#values.video?.codec === video?.codec
            && Object.shallowEqual(this.#values.video?.colorSpace, video?.colorSpace)
            && this.#values.video?.colorSpace?.primaries === video?.colorSpace?.primaries
            && this.#values.video?.colorSpace?.matrix === video?.colorSpace?.matrix
            && this.#values.video?.fullRange === video?.fullRange)
            return;

        this.#values.video = video;
        this.#ui.videoSection.element.classList.toggle("hidden", !video);
        this.#ui.resolutionRow.pendingValue = WI.UIString("%dx%d (%dfps)").format(video?.width ?? 0, video?.height ?? 0, video?.framerate ?? 0);
        this.#ui.resolutionRow.element.classList.toggle("hidden", !video);
        this.#ui.videoCodecRow.pendingValue = video?.codec;
        this.#ui.transferRow.pendingValue = video?.colorSpace?.transfer;
        this.#ui.primariesRow.pendingValue = video?.colorSpace?.primaries;
        this.#ui.matrixRow.pendingValue = video?.colorSpace?.matrix;
        if (video?.fullRange)
            this.#ui.fullRangeRow.pendingValue = WI.UIString("Full range", "Full range @ Media Sidebar", "Value string for Full Range color in the Media Sidebar");
        else
            this.#ui.fullRangeRow.pendingValue = WI.UIString("Video range", "Video range @ Media Sidebar", "Value string for Video Range color in the Media Sidebar");
        this.needsLayout();
    }

    #setAudio(audio)
    {
        if (Object.shallowEqual(this.#values.audio, audio))
            return;

        this.#values.audio = audio;
        this.#ui.audioSection.element.classList.toggle("hidden", !audio);
        this.#ui.audioCodecRow.pendingValue = audio?.codec;
        this.#ui.sampleRateRow.pendingValue = WI.UIString("%d Hz").format(audio?.sampleRate);
        switch (audio?.numberOfChannels) {
        case 1:
            this.#ui.channelsRow.pendingValue = WI.UIString("Mono");
            break;
        case 2:
            this.#ui.channelsRow.pendingValue = WI.UIString("Stereo");
            break;
        default:
            this.#ui.channelsRow.pendingValue = audio?.numberOfChannels;
            break;
        }
        this.needsLayout();
    }
};
