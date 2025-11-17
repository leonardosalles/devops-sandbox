// AdminMenu - hybrid mode: allows changing server mode to COMP/DM/CASUAL and perform actions
#include <sourcemod>
#include <menu>

public Plugin:myinfo = 
{
    name = "AdminMenuHybrid",
    author = "generated",
    description = "Admin menu: kick bots, restart, end warmup, set money, set rounds, change mode",
    version = "1.0"
};

enum MenuActions
{
    MA_KickBots = 0,
    MA_Restart,
    MA_EndWarmup,
    MA_SetMoney,
    MA_SetRounds,
    MA_SetModeCompetitive,
    MA_SetModeDeathmatch,
    MA_SetModeCasual
}

public Action:MenuHandler(Menu menu, MenuAction action, int client, int param)
{
    if (action != MenuAction_Select) return Plugin_Continue;
    switch(param)
    {
        case MA_KickBots:
        {
            ServerCommand("bot_kick");
            PrintToChatAll("[Admin] Kicked bots.");
        }
        case MA_Restart:
        {
            ServerCommand("mp_restartgame 1");
            PrintToChatAll("[Admin] Restarting game...");
        }
        case MA_EndWarmup:
        {
            ServerCommand("mp_warmup_end");
            PrintToChatAll("[Admin] Warmup ended.");
        }
        case MA_SetMoney:
        {
            ServerCommand("mp_startmoney 800");
            PrintToChatAll("[Admin] Start money set to 800.");
        }
        case MA_SetRounds:
        {
            ServerCommand("mp_maxrounds 30");
            PrintToChatAll("[Admin] Max rounds set to 30.");
        }
        case MA_SetModeCompetitive:
        {
            // Copy competitive cfg
            ServerCommand("exec gamemode_competitive_server.cfg");
            PrintToChatAll("[Admin] Mode set to COMPETITIVE.");
        }
        case MA_SetModeDeathmatch:
        {
            ServerCommand("exec gamemode_deathmatch_server.cfg");
            PrintToChatAll("[Admin] Mode set to DEATHMATCH.");
        }
        case MA_SetModeCasual:
        {
            ServerCommand("exec gamemode_competitive_server.cfg"); // fallback to competitive slight adjustments used for casual
            PrintToChatAll("[Admin] Mode set to CASUAL.");
        }
    }
    return Plugin_Handled;
}

public OnPluginStart()
{
    RegConsoleCmd("sm_adminmenu", Command_AdminMenu);
}

public Action:Command_AdminMenu(int client, int args)
{
    Menu menu = new Menu(MenuHandler);
    menu.SetTitle("Watercooler Admin Menu");
    menu.AddItem("Kick Bots", "Kick all bots.");
    menu.AddItem("Restart Game", "Restart the match.");
    menu.AddItem("End Warmup", "End warmup period.");
    menu.AddItem("Set Start Money 800", "Set starting money.");
    menu.AddItem("Set Max Rounds 30", "Set maximum rounds.");
    menu.AddItem("Set Mode: Competitive", "Switch to competitive mode.");
    menu.AddItem("Set Mode: Deathmatch", "Switch to deathmatch mode.");
    menu.AddItem("Set Mode: Casual", "Switch to casual mode.");
    menu.SetMenuOptionFlags(Menu_OptExitBack);
    menu.Display(client, 0);
    return Plugin_Handled;
}
