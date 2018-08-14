package cn.leancloud.play.example;

import cn.leancloud.play.Log;
import cn.leancloud.play.Reason;
import cn.leancloud.play.hook.*;

public class RejectAllRoomOpHook extends AbstractGameHook {
    private final Reason rejectReason = Reason.of(666, "I'm bad");

    @Override
    public void onCreateRoom(CreateRoomContext ctx) {
        CreateRoomRequest req = ctx.getRequest();

        Log.info("on create room {}", req.getPersistentParams());

        ctx.continueProcess();
    }

    @Override
    public void onBeforeJoinRoom(BeforeJoinRoomContext ctx) {
        JoinRoomRequest req = ctx.getRequest();

        Log.info("on join room {}", req.getPersistentParams());

        ctx.continueProcess();
    }

    @Override
    public void onBeforeLeaveRoom(BeforeLeaveRoomContext ctx) {
        LeaveRoomRequest req = ctx.getRequest();
        Log.info("on leave room {}", req.getPersistentParams());

        ctx.rejectProcess(rejectReason);
    }

    @Override
    public void onBeforeSetRoomProperties(BeforeSetRoomPropertiesContext ctx) {
        SetRoomPropertiesRequest req = ctx.getRequest();
        Log.info("on set room properties {}", req.getPersistentParams());

        ctx.rejectProcess(rejectReason);
    }

    @Override
    public void onBeforeSetPlayerProperties(BeforeSetPlayerPropertiesContext ctx) {
        SetPlayerPropertiesRequest req = ctx.getRequest();
        Log.info("on set player properties {}", req.getPersistentParams());

        ctx.rejectProcess(rejectReason);
    }

    @Override
    public void onBeforeOpenCloseRoom(BeforeOpenCloseRoomContext ctx) {
        OpenCloseRoomRequest req = ctx.getRequest();
        Log.info("on open close room {}", req.getPersistentParams());

        ctx.rejectProcess(rejectReason);
    }

    @Override
    public void onBeforeHideExposeRoom(BeforeHideExposeRoomContext ctx) {
        HideExposeRoomRequest req = ctx.getRequest();
        Log.info("on hide expose room {}", req.getPersistentParams());

        ctx.rejectProcess(rejectReason);
    }

    @Override
    public void onBeforeRaiseRpc(BeforeRaiseRpcContext ctx) {
        RaiseRpcRequest req = ctx.getRequest();
        Log.info("on raise rpc {}", req.getPersistentParams());

        ctx.rejectProcess(rejectReason);
    }

    @Override
    public void onCloseRoom(CloseRoomContext ctx) {
        CloseRoomRequest req = ctx.getRequest();
        Log.info("on close room {}", req.getPersistentParams());

        ctx.rejectProcess(rejectReason);
    }
}
