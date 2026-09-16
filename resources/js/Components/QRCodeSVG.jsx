import React, { useMemo } from 'react';

/**
 * Pure JavaScript QR Code Matrix Generator (Model 2, Version 1-10)
 * Zero external dependencies, pure vector SVG rendering.
 */
const QRCodeGenerator = (function () {
    const PAD0 = 0xec;
    const PAD1 = 0x11;

    // GF(256) Tables
    const EXP_TABLE = new Array(256);
    const LOG_TABLE = new Array(256);
    for (let i = 0, x = 1; i < 256; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
    }

    function glog(n) {
        if (n < 1) throw new Error('glog(' + n + ')');
        return LOG_TABLE[n];
    }
    function gexp(n) {
        while (n < 0) n += 255;
        while (n >= 256) n -= 255;
        return EXP_TABLE[n];
    }

    class Polynomial {
        constructor(num, shift = 0) {
            let offset = 0;
            while (offset < num.length && num[offset] === 0) offset++;
            this.num = new Array(num.length - offset + shift);
            for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
            for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
        }
        get(index) {
            return this.num[index];
        }
        getLength() {
            return this.num.length;
        }
        multiply(e) {
            const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
            for (let i = 0; i < this.getLength(); i++) {
                for (let j = 0; j < e.getLength(); j++) {
                    num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
                }
            }
            return new Polynomial(num);
        }
        mod(e) {
            if (this.getLength() - e.getLength() < 0) return this;
            const ratio = glog(this.get(0)) - glog(e.get(0));
            const num = new Array(this.getLength());
            for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
            for (let i = 0; i < e.getLength(); i++) {
                num[i] ^= gexp(glog(e.get(i)) + ratio);
            }
            return new Polynomial(num).mod(e);
        }
    }

    function getErrorCorrectPolynomial(errorCorrectLength) {
        let a = new Polynomial([1], 0);
        for (let i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new Polynomial([1, gexp(i)], 0));
        }
        return a;
    }

    const RS_BLOCK_TABLE = [
        [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
        [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
        [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
        [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
        [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
        [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
        [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
        [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
        [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
        [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
    ];

    const PATTERN_POSITION_TABLE = [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],
    ];

    class BitBuffer {
        constructor() {
            this.buffer = [];
            this.length = 0;
        }
        put(num, length) {
            for (let i = 0; i < length; i++) {
                this.putBit(((num >>> (length - i - 1)) & 1) === 1);
            }
        }
        putBit(bit) {
            const bufIndex = Math.floor(this.length / 8);
            if (this.buffer.length <= bufIndex) this.buffer.push(0);
            if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
            this.length++;
        }
    }

    function getRsBlocks(typeNumber, errorCorrectLevel) {
        const offset = (typeNumber - 1) * 4 + errorCorrectLevel;
        const row = RS_BLOCK_TABLE[offset];
        const list = [];
        for (let i = 0; i < row.length; i += 3) {
            const count = row[i];
            const totalCount = row[i + 1];
            const dataCount = row[i + 2];
            for (let j = 0; j < count; j++) {
                list.push({ totalCount, dataCount });
            }
        }
        return list;
    }

    function createData(typeNumber, errorCorrectLevel, data) {
        const rsBlocks = getRsBlocks(typeNumber, errorCorrectLevel);
        const buffer = new BitBuffer();

        // 8-bit Byte mode
        buffer.put(4, 4);
        const utf8Bytes = [];
        for (let i = 0; i < data.length; i++) {
            let c = data.charCodeAt(i);
            if (c < 128) utf8Bytes.push(c);
            else if (c < 2048) {
                utf8Bytes.push(192 | (c >> 6));
                utf8Bytes.push(128 | (c & 63));
            } else if (c < 55296 || c >= 57344) {
                utf8Bytes.push(224 | (c >> 12));
                utf8Bytes.push(128 | ((c >> 6) & 63));
                utf8Bytes.push(128 | (c & 63));
            } else {
                i++;
                c = 65536 + (((c & 1023) << 10) | (data.charCodeAt(i) & 1023));
                utf8Bytes.push(240 | (c >> 18));
                utf8Bytes.push(128 | ((c >> 12) & 63));
                utf8Bytes.push(128 | ((c >> 6) & 63));
                utf8Bytes.push(128 | (c & 63));
            }
        }

        buffer.put(utf8Bytes.length, typeNumber < 10 ? 8 : 16);
        for (let i = 0; i < utf8Bytes.length; i++) {
            buffer.put(utf8Bytes[i], 8);
        }

        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;

        if (buffer.length + 4 <= totalDataCount * 8) {
            buffer.put(0, 4);
        }
        while (buffer.length % 8 !== 0) {
            buffer.putBit(false);
        }
        while (buffer.length < totalDataCount * 8) {
            buffer.put(PAD0, 8);
            if (buffer.length >= totalDataCount * 8) break;
            buffer.put(PAD1, 8);
        }

        let offset = 0;
        const dcdata = [];
        const ecdata = [];
        for (let r = 0; r < rsBlocks.length; r++) {
            const dcCount = rsBlocks[r].dataCount;
            const ecCount = rsBlocks[r].totalCount - dcCount;
            const rawDc = buffer.buffer.slice(offset, offset + dcCount);
            offset += dcCount;
            dcdata.push(rawDc);

            const rsPoly = getErrorCorrectPolynomial(ecCount);
            const rawPoly = new Polynomial(rawDc, rsPoly.getLength() - 1);
            const modPoly = rawPoly.mod(rsPoly);
            const ec = new Array(rsPoly.getLength() - 1).fill(0);
            for (let i = 0; i < ec.length; i++) {
                const modIndex = i + modPoly.getLength() - ec.length;
                ec[i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
            }
            ecdata.push(ec);
        }

        const res = [];
        let maxDcCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) maxDcCount = Math.max(maxDcCount, rsBlocks[i].dataCount);
        for (let i = 0; i < maxDcCount; i++) {
            for (let r = 0; r < rsBlocks.length; r++) {
                if (i < dcdata[r].length) res.push(dcdata[r][i]);
            }
        }
        let maxEcCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) maxEcCount = Math.max(maxEcCount, rsBlocks[i].totalCount - rsBlocks[i].dataCount);
        for (let i = 0; i < maxEcCount; i++) {
            for (let r = 0; r < rsBlocks.length; r++) {
                if (i < ecdata[r].length) res.push(ecdata[r][i]);
            }
        }
        return res;
    }

    class QRCodeModel {
        constructor(typeNumber, errorCorrectLevel) {
            this.typeNumber = typeNumber;
            this.errorCorrectLevel = errorCorrectLevel;
            this.modules = null;
            this.moduleCount = 0;
            this.data = '';
        }
        addData(data) {
            this.data = data;
        }
        isDark(row, col) {
            if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
                return false;
            }
            return this.modules[row][col];
        }
        getModuleCount() {
            return this.moduleCount;
        }
        make() {
            this.moduleCount = this.typeNumber * 4 + 17;
            this.modules = new Array(this.moduleCount);
            for (let row = 0; row < this.moduleCount; row++) {
                this.modules[row] = new Array(this.moduleCount).fill(null);
            }
            this.setupPositionProbePattern(0, 0);
            this.setupPositionProbePattern(this.moduleCount - 7, 0);
            this.setupPositionProbePattern(0, this.moduleCount - 7);
            this.setupPositionAdjustPattern();
            this.setupTimingPattern();
            this.setupTypeInfo(false, 0);

            const data = createData(this.typeNumber, this.errorCorrectLevel, this.data);
            this.mapData(data, 0);
        }
        setupPositionProbePattern(row, col) {
            for (let r = -1; r <= 7; r++) {
                if (row + r <= -1 || this.moduleCount <= row + r) continue;
                for (let c = -1; c <= 7; c++) {
                    if (col + c <= -1 || this.moduleCount <= col + c) continue;
                    if (
                        (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                        (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                        (2 <= r && r <= 4 && 2 <= c && c <= 4)
                    ) {
                        this.modules[row + r][col + c] = true;
                    } else {
                        this.modules[row + r][col + c] = false;
                    }
                }
            }
        }
        setupTimingPattern() {
            for (let r = 8; r < this.moduleCount - 8; r++) {
                if (this.modules[r][6] !== null) continue;
                this.modules[r][6] = r % 2 === 0;
            }
            for (let c = 8; c < this.moduleCount - 8; c++) {
                if (this.modules[6][c] !== null) continue;
                this.modules[6][c] = c % 2 === 0;
            }
        }
        setupPositionAdjustPattern() {
            const pos = PATTERN_POSITION_TABLE[this.typeNumber - 1];
            if (!pos) return;
            for (let i = 0; i < pos.length; i++) {
                for (let j = 0; j < pos.length; j++) {
                    const row = pos[i];
                    const col = pos[j];
                    if (this.modules[row][col] !== null) continue;
                    for (let r = -2; r <= 2; r++) {
                        for (let c = -2; c <= 2; c++) {
                            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                                this.modules[row + r][col + c] = true;
                            } else {
                                this.modules[row + r][col + c] = false;
                            }
                        }
                    }
                }
            }
        }
        setupTypeInfo(test, maskPattern) {
            const data = (this.errorCorrectLevel << 3) | maskPattern;
            const bits = (function (data) {
                let d = data << 10;
                while (d >= (1 << 10)) {
                    let b = 1;
                    while ((1 << (10 + b)) <= d) b++;
                    d ^= (0x537 << (b - 1));
                }
                return ((data << 10) | d) ^ 0x5412;
            })(data);

            for (let i = 0; i < 15; i++) {
                const mod = !test && ((bits >> i) & 1) === 1;
                if (i < 6) this.modules[i][8] = mod;
                else if (i < 8) this.modules[i + 1][8] = mod;
                else this.modules[this.moduleCount - 15 + i][8] = mod;

                if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
                else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
                else this.modules[8][15 - i - 1] = mod;
            }
            this.modules[this.moduleCount - 8][8] = !test;
        }
        mapData(data, maskPattern) {
            let inc = -1;
            let row = this.moduleCount - 1;
            let bitIndex = 7;
            let byteIndex = 0;

            for (let col = this.moduleCount - 1; col > 0; col -= 2) {
                if (col === 6) col--;
                while (true) {
                    for (let c = 0; c < 2; c++) {
                        if (this.modules[row][col - c] === null) {
                            let dark = false;
                            if (byteIndex < data.length) {
                                dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
                            }
                            const mask = (row + (col - c)) % 2 === 0;
                            if (mask) dark = !dark;

                            this.modules[row][col - c] = dark;
                            bitIndex--;
                            if (bitIndex === -1) {
                                byteIndex++;
                                bitIndex = 7;
                            }
                        }
                    }
                    row += inc;
                    if (row < 0 || this.moduleCount <= row) {
                        row -= inc;
                        inc = -inc;
                        break;
                    }
                }
            }
        }
    }

    return function generate(text, ecLevel = 1) {
        for (let type = 1; type <= 10; type++) {
            try {
                const qr = new QRCodeModel(type, ecLevel);
                qr.addData(text);
                qr.make();
                return qr;
            } catch (e) {
                // Try next type
            }
        }
        throw new Error('Data payload too large for QR Code Model');
    };
})();

export default function QRCodeSVG({
    value = '',
    size = 128,
    bgColor = '#ffffff',
    fgColor = '#000000',
    includeMargin = true,
    className = '',
    title = 'QR Code',
}) {
    const { pathData, viewBoxSize } = useMemo(() => {
        if (!value) return { pathData: '', viewBoxSize: 0 };
        try {
            const qr = QRCodeGenerator(value, 1);
            const count = qr.getModuleCount();
            const margin = includeMargin ? 2 : 0;
            const totalSize = count + margin * 2;

            let path = '';
            for (let r = 0; r < count; r++) {
                for (let c = 0; c < count; c++) {
                    if (qr.isDark(r, c)) {
                        const x = c + margin;
                        const y = r + margin;
                        path += `M${x},${y}h1v1h-1z `;
                    }
                }
            }

            return {
                pathData: path,
                viewBoxSize: totalSize,
            };
        } catch (err) {
            console.error('Failed to generate QR Code SVG:', err);
            return { pathData: '', viewBoxSize: 0 };
        }
    }, [value, includeMargin]);

    if (!value || !pathData) {
        return null;
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            className={`inline-block ${className}`}
            style={{ shapeRendering: 'crispEdges' }}
            role="img"
            aria-label={title}
        >
            <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
            <path d={pathData} fill={fgColor} />
        </svg>
    );
}

