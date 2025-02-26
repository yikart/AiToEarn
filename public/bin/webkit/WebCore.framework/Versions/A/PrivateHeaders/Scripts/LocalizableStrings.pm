# Copyright (C) 2006, 2007, 2009, 2010, 2013, 2015 Apple Inc. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 1. Redistributions of source code must retain the above copyright
#    notice, this list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright
#    notice, this list of conditions and the following disclaimer in the
#    documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
# THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
# PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
# BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
# THE POSSIBILITY OF SUCH DAMAGE.

use strict;

my $treatWarningsAsErrors = 0;

sub setTreatWarningsAsErrors($)
{
    ($treatWarningsAsErrors) = @_;
}

my $sawError = 0;

sub sawError()
{
    return $sawError;
}

sub emitError($$$)
{
    my ($file, $line, $message) = @_;
    print "$file:$line: $message\n";
    $sawError = 1;
}

sub emitWarning($$$)
{
    my ($file, $line, $message) = @_;
    my $prefix = $treatWarningsAsErrors ? "" : "warning: ";
    print "$file:$line: $prefix$message\n";
    $sawError = 1 if $treatWarningsAsErrors;
}

# Unescapes C language hexadecimal escape sequences.
sub unescapeHexSequence($)
{
    my ($originalStr) = @_;

    my $escapedStr = $originalStr;
    my $unescapedStr = "";

    for (;;) {
        if ($escapedStr =~ s-^\\x([[:xdigit:]]+)--) {
            if (256 <= hex($1)) {
                print "Hexadecimal escape sequence out of range: \\x$1\n";
                return undef;
            }
            $unescapedStr .= pack("H*", $1);
        } elsif ($escapedStr =~ s-^(.)--) {
            $unescapedStr .= $1;
        } else {
            return $unescapedStr;
        }
    }
}

my $keyCollisionCount = 0;

sub keyCollisionCount()
{
    return $keyCollisionCount;
}

my $localizedCount = 0;

sub localizedCount()
{
    return $localizedCount;
}

my %stringByKey;
my %commentByKey;
my %fileByKey;
my %lineByKey;

sub HandleUIString
{
    my ($string, $key, $comment, $file, $line) = @_;

    $localizedCount++;

    my $bad = 0;
    $string = unescapeHexSequence($string);
    if (!defined($string)) {
        print "$file:$line: string has an illegal hexadecimal escape sequence\n";
        $bad = 1;
    }
    $key = unescapeHexSequence($key);
    if (!defined($key)) {
        print "$file:$line: key has an illegal hexadecimal escape sequence\n";
        $bad = 1;
    }
    $comment = unescapeHexSequence($comment);
    if (!defined($comment)) {
        print "$file:$line: comment has an illegal hexadecimal escape sequence\n";
        $bad = 1;
    }
    if (grep { $_ == 0xFFFD } unpack "U*", $string) {
        print "$file:$line: string for translation has illegal UTF-8 -- most likely a problem with the Text Encoding of the source file\n";
        $bad = 1;
    }
    if ($string ne $key && grep { $_ == 0xFFFD } unpack "U*", $key) {
        print "$file:$line: key has illegal UTF-8 -- most likely a problem with the Text Encoding of the source file\n";
        $bad = 1;
    }
    if (grep { $_ == 0xFFFD } unpack "U*", $comment) {
        print "$file:$line: comment for translation has illegal UTF-8 -- most likely a problem with the Text Encoding of the source file\n";
        $bad = 1;
    }
    if ($bad) {
        $sawError = 1;
        return;
    }
    
    if ($stringByKey{$key} && $stringByKey{$key} ne $string) {
        emitWarning($file, $line, "encountered the same key, \"$key\", twice, with different strings");
        emitWarning($fileByKey{$key}, $lineByKey{$key}, "previous occurrence");
        $keyCollisionCount++;
        return;
    }
    if ($commentByKey{$key} && $commentByKey{$key} ne $comment) {
        emitWarning($file, $line, "encountered the same key, \"$key\", twice, with different comments");
        emitWarning($fileByKey{$key}, $lineByKey{$key}, "previous occurrence");
        $keyCollisionCount++;
        return;
    }

    $fileByKey{$key} = $file;
    $lineByKey{$key} = $line;
    $stringByKey{$key} = $string;
    $commentByKey{$key} = $comment;
}

sub writeStringsFile($)
{
    my ($file) = @_;

    my $localizedStrings = "";

    for my $key (sort keys %commentByKey) {
        $localizedStrings .= "/* $commentByKey{$key} */\n\"$key\" = \"$stringByKey{$key}\";\n\n";
    }

    # Write out the strings file as UTF-8
    open STRINGS, ">", $file or die;
    print STRINGS $localizedStrings;
    close STRINGS;
}

sub verifyStringsFile($)
{
    my ($file) = @_;

    open STRINGS, $file or die;

    my $lastComment;
    my $line;
    my $sawError;

    while (<STRINGS>) {
        chomp;

        next if (/^\s*$/);

        if (/^\/\* (.*) \*\/$/) {
            $lastComment = $1;
        } elsif (/^"((?:[^\\]|\\[^"])*)"\s*=\s*"((?:[^\\]|\\[^"])*)";$/) #
        {
            my $string = delete $stringByKey{$1};
            if (!defined $string) {
                print "$file:$.: unused key \"$1\"\n";
                $sawError = 1;
            } else {
                if (!($string eq $2)) {
                    print "$file:$.: unexpected value \"$2\" for key \"$1\"\n";
                    print "$fileByKey{$1}:$lineByKey{$1}: expected value \"$string\" defined here\n";
                    $sawError = 1;
                }
                if (!($lastComment eq $commentByKey{$1})) {
                    print "$file:$.: unexpected comment /* $lastComment */ for key \"$1\"\n";
                    print "$fileByKey{$1}:$lineByKey{$1}: expected comment /* $commentByKey{$1} */ defined here\n";
                    $sawError = 1;
                }
            }
        } else {
            print "$file:$.: line with unexpected format: $_\n";
            $sawError = 1;
        }
    }

    for my $missing (keys %stringByKey) {
        print "$fileByKey{$missing}:$lineByKey{$missing}: missing key \"$missing\"\n";
        $sawError = 1;
    }

    if ($sawError) {
        print "\n$file:0: file is not up to date.\n";
        exit 1;
    }
}

1;
