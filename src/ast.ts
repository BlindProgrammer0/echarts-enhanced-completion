import * as vscode from 'vscode';
const espree = require('espree');

export default class Ast {
    private keyword: string;
    private document: vscode.TextDocument;
    private astItems: AstItem[] = [];

    constructor(keyword: string, document: vscode.TextDocument) {
        this.keyword = keyword;
        this.document = document;
        this.init(keyword, document);
    }

    public get validate() : boolean {
        return this.astItems.length > 0 && this.astItems.some(v => v.expression);
    }

    public getAstItem(position: vscode.Position): AstItem | undefined {
        return this.astItems.find(item => item.range.contains(position));
    }

    /** 获取所在位置的最小Ast节点，并且记录路径 */
    public getMinAstNode(astItem: AstItem | undefined, position: vscode.Position): [AstNode | null, Paths] {
        if (!astItem || !astItem.expression) return [null, []];
        return astItem.getAstNode(this.document.offsetAt(position) - this.document.offsetAt(astItem.range.start) + 1);
    }

    /** 文档内容变更时，对局部进行更新 */
    public patch(contentChanges: readonly vscode.TextDocumentContentChangeEvent[]): void {
        contentChanges.forEach(contentChange => {
            // 对已经存在的目标进行更新
            this.astItems = this.astItems.filter(item => item.patch(contentChange));
            // 将新的目标加入数组中
            const lines = contentChange.text.split('\n');
            for (let index = 0; index < lines.length; index++) {
                let text: string;
                if (!index) {
                    text = this.document.lineAt(contentChange.range.start.line).text;
                } else if (index === lines.length - 1) {
                    text = this.document.lineAt(contentChange.range.start.line + lines.length - 1).text;
                } else {
                    text = lines[index];
                }
                if (text.includes(this.keyword)) {
                    this.init(this.keyword, this.document, contentChange.range.start.line + index, 2 * contentChange.range.start.line - contentChange.range.end.line + lines.length);
                    break;
                }
            }
        });
    }

    /** 更新校验 */
    public updateDiagnostics(uri: vscode.Uri, collection: vscode.DiagnosticCollection) {
        // TODO: 下面是示例，需要更改
        // collection.set(uri, [{
        //     code: 'xAxis',
        //     message: 'cannot assign twice to immutable variable `x`',
        //     range: new vscode.Range(new vscode.Position(3, 5), new vscode.Position(3, 9)),
        //     severity: vscode.DiagnosticSeverity.Warning,
        //     source: 'echarts-enhanced-completion',
        //     relatedInformation: [
        //         new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(new vscode.Position(1, 8), new vscode.Position(1, 9))), 'first assignment to `x`'),
        //     ],
        // }]);
    }

    private init(keyword: string, document: vscode.TextDocument, startLine = 0, endLine = document.lineCount) {
        let start: vscode.Position | null = null;
        let curRowStart = false;
        let startRowSpaceCount: number = 0;
        let startPositionLine: number = 0;
        for (let line = startLine; line < endLine || (start && endLine < document.lineCount); line++) {
            const textLine = document.lineAt(line);
            if (curRowStart) {
                // 当前行为开始行
                const index = textLine.text.indexOf('{');
                if (index !== -1) {
                    start = new vscode.Position(line, index);
                    startRowSpaceCount = textLine.firstNonWhitespaceCharacterIndex;
                } else {
                    // 注释行的下一行不存在目标对象
                    this.astItems.push(new AstItem(keyword, document, document.lineAt(startPositionLine).range, startPositionLine, line));
                }
                curRowStart = false;
            } else if (start && !textLine.isEmptyOrWhitespace && textLine.firstNonWhitespaceCharacterIndex <= startRowSpaceCount) {
                // 运行到这里，则当前行应为结束行
                const index = textLine.text.indexOf('}');
                if (index !== -1) {
                    const end = new vscode.Position(line, index + 1);
                    this.astItems.push(new AstItem(keyword, document, new vscode.Range(start, end), startPositionLine, end.line));
                } else {
                    // 结束行没有 '}'，说明存在格式错误或语法错误
                    this.astItems.push(new AstItem(keyword, document, document.lineAt(start.line).range, startPositionLine, start.line + 1));
                }
                start = null;
            } else if (textLine.text.trim() === keyword) {
                // 将下一行标记为开始行
                curRowStart = true;
                startPositionLine = line;
            }
        }
        if (curRowStart) {
            // 注释行之后没有下一行
            this.astItems.push(new AstItem(keyword, document, document.lineAt(document.lineCount - 1).range, startPositionLine, startPositionLine + 1));
        } else if (start) {
            // 没有找到结束行
            this.astItems.push(new AstItem(keyword, document, document.lineAt(start.line).range, start.line, start.line + 1));
        }
    }
}

export class AstItem {
    public keyword: string;
    public expression: AstNode | null = null; // 目标的 ast 表达式
    public range: vscode.Range; // 目标对象所在的范围
    private document: vscode.TextDocument;
    private startRow: number; // 注释所在行
    private endRow: number; // 结尾右括号所在行，如果不存在目标对象，则与开始行相等

    constructor(keyword: string, document: vscode.TextDocument, range: vscode.Range, startRow: number, endRow: number) {
        this.keyword = keyword;
        this.document = document;
        this.range = range;
        this.startRow = startRow;
        this.endRow = endRow;
        this.expression = this.parse();
    }

    public get isEmpty(): boolean {
        return !this.expression?.properties.length;
    }

    /** 根据位置获取最小节点，并记录获取路径 */
    public getAstNode(index: number, node: AstNode = this.expression as AstNode, paths: Paths = []): [AstNode, Paths] {
        const keyList: Key[] = espree.VisitorKeys[node.type];
        for (let i = 0; i < keyList.length; i++) {
            const key = keyList[i];
            if (Array.isArray(node[key])) {
                const i = (node[key] as Array<AstNode>).findIndex(item => this.isNodeContainIndex(item, index));
                if (i !== -1) {
                    const targetNode = (node[key] as Array<AstNode>)[i];
                    switch (targetNode.type) {
                        case 'Property':
                            paths.push(targetNode.key.name);
                            return this.getAstNode(index, targetNode, paths);
                        case 'ObjectExpression':
                            paths.push(this.toSimpleObject(targetNode));
                            return this.getAstNode(index, targetNode, paths);
                    }
                }
            } else {
                if (this.isNodeContainIndex(node[key] as AstNode, index)) {
                    return this.getAstNode(index, node[key] as AstNode, paths);
                }
            }
        }
        return [node, paths];
    }

    /** 根据路径获取对应的 SimpleObject */
    public getSimpleObjectByPaths(paths: Paths): SimpleObject {
        let node = this.expression as AstNode;
        paths.forEach(path => {
            switch (node.type) {
                case 'Property':
                    if (typeof path === 'string') {
                        node = node.value.properties.find(item => item.key.name === path) as AstNode;
                    } else {
                        node = node.value.elements.find(item => JSON.stringify(this.toSimpleObject(item)) === JSON.stringify(path)) as AstNode;
                    }
                    break;
                case 'ObjectExpression':
                    node = node.properties.find(item => item.key.name === path) as AstNode;
                    break;
            }
        });
        return this.toSimpleObject(node);
    }

    public patch(contentChange: vscode.TextDocumentContentChangeEvent): boolean {
        // 更新位置在当前范围之后，不需要更新
        if (contentChange.range.start.line > this.endRow) {
            return true;
        }
        // 更新位置在当前范围之前，仅调整范围
        if (contentChange.range.end.line < this.startRow) {
            const offset = contentChange.range.start.line - contentChange.range.end.line + contentChange.text.split('\n').length - 1;
            this.startRow += offset;
            this.endRow += offset;
            this.range = new vscode.Range(this.range.start.translate(offset), this.range.end.translate(offset));
            return true;
        }
        // 如果修改了注释行，那么删除
        if (contentChange.range.start.line <= this.startRow) {
            return false;
        }
        // 目标不存在时，尝试初始化
        if (!this.expression) {
            if (contentChange.range.start.line === this.startRow + 1) {
                this.init();
            }
            return true;
        }
        // 如果填充包含了多行或者修改包含了结束行，那么需要重新初始化
        if (contentChange.text.indexOf('\n') !== -1 || contentChange.range.end.line >= this.endRow) {
            this.init();
            return true;
        }
        // 调整范围
        this.endRow += contentChange.range.start.line - contentChange.range.end.line + contentChange.text.split('\n').length - 1;
        this.range = new vscode.Range(this.range.start, new vscode.Position(this.endRow, this.range.end.character));

        // 调整 expression
        // TODO: 获取范围内的最小对象节点
        const node = this.expression;
        let range: vscode.Range;
        if (node === this.expression) {
            this.expression = this.parse(this.range) || this.expression;
        } else {
            range = new vscode.Range(
                this.document.positionAt(this.document.offsetAt(this.range.start) + node.start),
                this.document.positionAt(this.document.offsetAt(this.range.start) + node.end - contentChange.rangeLength + contentChange.text.length),
            );
            // TODO: 替换节点
            // TODO: 更新节点位置
        }
        return true;
    }

    private init(): void {
        const startLine = this.startRow + 1;
        const startIndex = this.document.lineAt(startLine).text.indexOf('{');
        if (startIndex !== -1) {
            // 不考虑目标在同一行的情况，将其视为不存在
            const start = new vscode.Position(startLine, startIndex);
            const startRowSpaceCount = this.document.lineAt(startLine).firstNonWhitespaceCharacterIndex;
            let flag = true; // 是否找到结束行，没找到为true
            for (let line = startLine + 1; line < this.document.lineCount; line++) {
                const textLine = this.document.lineAt(line);
                if (!textLine.isEmptyOrWhitespace && textLine.firstNonWhitespaceCharacterIndex <= startRowSpaceCount) {
                    // 运行到这里，则当前行应为结束行
                    const index = textLine.text.indexOf('}');
                    if (index !== -1) {
                        this.range = new vscode.Range(start, new vscode.Position(line, index + 1));
                        this.startRow = start.line - 1;
                        this.endRow = line;
                        flag = false;
                    }
                    break;
                }
            }
            if (flag) {
                this.range = this.document.lineAt(startLine - 1).range;
                this.startRow = startLine - 1;
                this.endRow = startLine;
            }
            this.expression = this.parse();
        }
    }

    private parse(range = this.range): AstNode | null {
        if (this.startRow !== this.endRow - 1) {
            const targetText = '(' + this.document.getText(range) + ')';
            try {
                const ast = espree.parse(targetText, { ecmaVersion: 'latest' });
                const expression = ast.body[0].expression;
                this.translate(expression, 0, -1);
                return expression;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /** 将表达式中中所有大于 limit 的位置偏移 offset */
    private translate(node: AstNode, limit: number, offset: number) {
        if (node.start > limit) node.start += offset;
        if (node.end > limit) node.end += offset;
        const keyList: Key[] = espree.VisitorKeys[node.type];
        for (let i = 0; i < keyList.length; i++) {
            const key = keyList[i];
            if (Array.isArray(node[key])) {
                (node[key] as AstNode[]).forEach(v => this.translate(v, limit, offset));
            } else if (typeof node[key] === 'object') {
                this.translate(node[key] as AstNode, limit, offset);
            }
        }
    }

    /** 位置是否在节点中 */
    private isNodeContainIndex(node: AstNode, index: number): boolean {
        return node.start < index && index < node.end;
    }

    private toSimpleObject(node: AstNode): SimpleObject {
        const item: SimpleObject = {};
        switch (node.type) {
            case 'ObjectExpression':
                node.properties.forEach((property) => {
                    if (property.value.raw) {
                        item[property.key.name] = property.value.raw;
                    }
                });
                break;
            case 'Property':
                return this.toSimpleObject(node.value);
        }
        return item;
    }
}
