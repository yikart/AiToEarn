# This code is original from jsmin by Douglas Crockford, it was translated to
# Python by Baruch Even. It was rewritten by Dave St.Germain for speed.
#
# The MIT License (MIT)
#
# Copyright (c) 2013 Dave St.Germain
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.


import sys
import io
python_text_type = str


__all__ = ['jsmin', 'JavascriptMinify']
__version__ = '2.0.9'


def jsmin(js):
    """
    returns a minified version of the javascript string
    """
    klass = io.StringIO
    ins = klass(js)
    outs = klass()
    JavascriptMinify(ins, outs).minify()
    return outs.getvalue()


class JavascriptMinify(object):
    """
    Minify an input stream of javascript, writing
    to an output stream
    """

    def __init__(self, instream=None, outstream=None):
        self.ins = instream
        self.outs = outstream

    def minify(self, instream=None, outstream=None):
        if instream and outstream:
            self.ins, self.outs = instream, outstream

        self.is_return = False
        self.return_buf = ''

        def write(char):
            # all of this is to support literal regular expressions.
            # sigh
            if str(char) in 'return':
                self.return_buf += char
                self.is_return = self.return_buf == 'return'
            self.outs.write(char)
            if self.is_return:
                self.return_buf = ''

        def read(n):
            char = self.ins.read(n)
            if not isinstance(char, python_text_type):
                raise ValueError("ERROR: The script jsmin.py can only handle text input, but it received input of type %s" % type(char))
            return char

        space_strings = "abcdefghijklmnopqrstuvwxyz"\
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$\\"
        starters, enders = '{[(+-', '}])+-"\''
        newlinestart_strings = starters + space_strings
        newlineend_strings = enders + space_strings
        do_newline = False
        do_space = False
        escape_slash_count = 0
        doing_single_comment = False
        previous_before_comment = ''
        doing_multi_comment = False
        in_re = False
        in_quote = ''
        quote_buf = []

        previous = read(1)
        if previous == '\\':
            escape_slash_count += 1
        next1 = read(1)
        if previous == '/':
            if next1 == '/':
                doing_single_comment = True
            elif next1 == '*':
                doing_multi_comment = True
                previous = next1
                next1 = read(1)
            else:
                write(previous)
        elif not previous:
            return
        elif str(previous) >= "!":
            if str(previous) in "'\"":
                in_quote = previous
            write(previous)
            previous_non_space = previous
        else:
            previous_non_space = ' '
        if not next1:
            return

        while 1:
            next2 = read(1)
            if not next2:
                last = next1.strip()
                if not (doing_single_comment or doing_multi_comment)\
                    and last not in ('', '/'):
                    if in_quote:
                        write(''.join(quote_buf))
                    write(last)
                break
            if doing_multi_comment:
                if next1 == '*' and next2 == '/':
                    doing_multi_comment = False
                    next2 = read(1)
            elif doing_single_comment:
                if next1 in '\r\n':
                    doing_single_comment = False
                    while next2 in '\r\n':
                        next2 = read(1)
                        if not next2:
                            break
                    if previous_before_comment in ')}]':
                        do_newline = True
                    elif previous_before_comment in space_strings:
                        write('\n')
            elif in_quote:
                quote_buf.append(next1)

                if next1 == in_quote:
                    numslashes = 0
                    for c in reversed(quote_buf[:-1]):
                        if c != '\\':
                            break
                        else:
                            numslashes += 1
                    if numslashes % 2 == 0:
                        in_quote = ''
                        write(''.join(quote_buf))
            elif str(next1) in '\r\n':
                if previous_non_space in newlineend_strings \
                    or previous_non_space > '~':
                    while 1:
                        if next2 < '!':
                            next2 = read(1)
                            if not next2:
                                break
                        else:
                            if next2 in newlinestart_strings \
                                or next2 > '~' or next2 == '/':
                                do_newline = True
                            break
            elif str(next1) < '!' and not in_re:
                if (previous_non_space in space_strings \
                    or previous_non_space > '~') \
                    and (next2 in space_strings or next2 > '~'):
                    do_space = True
                elif previous_non_space in '-+' and next2 == previous_non_space:
                    # protect against + ++ or - -- sequences
                    do_space = True
                elif self.is_return and next2 == '/':
                    # returning a regex...
                    write(' ')
            elif next1 == '/':
                if do_space:
                    write(' ')
                if in_re:
                    if previous != '\\' or (not escape_slash_count % 2) or next2 in 'gimy':
                        in_re = False
                    write('/')
                elif next2 == '/':
                    doing_single_comment = True
                    previous_before_comment = previous_non_space
                elif next2 == '*':
                    doing_multi_comment = True
                    previous = next1
                    next1 = next2
                    next2 = read(1)
                else:
                    in_re = previous_non_space in '(,=:[?!&|' or self.is_return  # literal regular expression
                    write('/')
            else:
                if do_space:
                    do_space = False
                    write(' ')
                if do_newline:
                    write('\n')
                    do_newline = False

                write(next1)
                if not in_re and str(next1) in "'\"`":
                    in_quote = next1
                    quote_buf = []

            previous = next1
            next1 = next2

            if str(previous) >= '!':
                previous_non_space = previous

            if previous == '\\':
                escape_slash_count += 1
            else:
                escape_slash_count = 0

if __name__ == '__main__':
    minifier = JavascriptMinify(sys.stdin, sys.stdout)
    minifier.minify()
    sys.stdout.write('\n')
