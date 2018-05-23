import * as React from 'react';
import SmartGoBoard from '../widgets/SmartGoBoard';
import BoardController from '../widgets/BoardController';
import UserPreferences from '../common/UserPreferences';
import SGF from '../common/SGF';

interface LocalProps {
}

interface LocalStates {
    aiAutoplay?: boolean;
}

export default class LocalGame extends React.Component<LocalProps, LocalStates> {

    static smartBoard?: SmartGoBoard;
    static forceUpdate = () => LocalGame.smartBoard && LocalGame.smartBoard.forceUpdate();

    private _smartboard: SmartGoBoard;
    get smartBoard() { return this._smartboard; }
    set smartBoard(value: SmartGoBoard) { this._smartboard = LocalGame.smartBoard = value; }
    private boardController: BoardController;

    constructor(props: any, ctx: any) {
        super(props, ctx);
        this.state = {};
    }

    async componentDidMount() {
        let sgf = UserPreferences.kifu;
        let smartBoard = LocalGame.smartBoard;

        if (sgf && smartBoard) {
            try {
                let { game } = SGF.import(sgf);
                if (!game) return;

                if (UserPreferences.gameMode === 'review') {
                    let deltaCursor = UserPreferences.cursor - game.cursor;
                    game.changeCursor(deltaCursor);
                } else {
                    game.changeCursor(9999);
                }

                await smartBoard.importGame({ game, whitePlayer: UserPreferences.whitePlayer, blackPlayer: UserPreferences.blackPlayer }, UserPreferences.gameMode as any, false);
            } catch{ }
        }

        window.onunload = () => this.saveKifu();
    }

    componentWillUnmount() {
        this.saveKifu();
        window.onunload = null;
        LocalGame.smartBoard = undefined;
    }

    private saveKifu() {
        let sgf = this.smartBoard.exportGame();
        UserPreferences.kifu = sgf;
        UserPreferences.gameMode = this.smartBoard.gameMode;
        LocalGame.smartBoard = undefined;
    }

    render() {
        let isLandscape = window.innerWidth > window.innerHeight;
        let width = isLandscape ? (window.innerHeight / window.innerWidth * 100 - 7.5) : 100;

        return (
            <div style={{ width: '100%', height: '100%', }}>
                <div style={{ width: `${width}%`, height: '100%', margin: 'auto', marginTop: -8, }}>
                    <SmartGoBoard id="smartboard"
                        ref={e => this.smartBoard = e!}
                        onEnterBranch={() => this.boardController.enterBranchMode()}
                        onExitBranch={() => this.boardController.exitBranchMode()}
                        showWinrate={UserPreferences.winrate}
                        showHeatmap={UserPreferences.heatmap}
                        aiAutoPlay={this.state.aiAutoplay} />
                </div>

                <BoardController
                    ref={e => this.boardController = e!}
                    mode={this.smartBoard ? this.smartBoard.gameMode : 'self'}
                    onCursorChange={d => this.smartBoard.changeCursor(d)}
                    onAIThinkingClick={() => this.smartBoard.peekSgfWinrate()}
                    onAIAutoPlayClick={autoplay => { this.setState({ aiAutoplay: autoplay }); if (autoplay) this.smartBoard.autoGenmove(true); }}
                    onExitBranch={() => this.smartBoard.returnToMainBranch()}
                    style={{ position: 'fixed', zIndex: 2, transition: 'all 1s' }} />
            </div>
        );
    }
}