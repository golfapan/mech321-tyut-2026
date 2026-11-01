% Project 01: solve the taught seat ODE for Design A and Design B.
% Supplied solver: students run, plot and compare, not implement ode45.
clearvars; close all; clc;
folder = fullfile(fileparts(mfilename('fullpath')), 'Plots');
if ~exist(folder, 'dir'), mkdir(folder); end
m = 80; g = 9.81; T = 0.35; alpha = 2*pi/T;
kc = 1000*[18 1.5; 18 0]; % kN/m, kN s/m -> N/m, N s/m
labels = {'A','B'};
names = {'Design A: c=1.5 kN s/m','Design B: c=0 kN s/m'};
colors = [0 .35 .70; .90 .32 .00; .08 .08 .08; .55 .18 .70];
lineStyles = {'-','--','-.',':'};
r = @(t) .015*(1-cos(alpha*t)).*(t>=0 & t<=T);
rd = @(t) .015*alpha*sin(alpha*t).*(t>=0 & t<=T);
t = (0:0.0001:3)'; peaks = zeros(size(kc,1),2);
f = figure('Visible','off','Color','w','Position',[100 100 1400 1100]);
tiles = tiledlayout(3,1,'TileSpacing','compact');
ax1 = nexttile; plot(t,1000*r(t),'k','LineWidth',1.7);
ylabel('Floor r (mm)'); title('Prescribed input'); ylim([0 34]);
ax2 = nexttile; hold on; ylabel('Acceleration (g)');
title('Seat dynamic acceleration'); ylim([-1.3 1.3]);
ax3 = nexttile; hold on; ylabel('Travel x-r (mm)');
title('Relative seat travel'); ylim([-55 55]);
options = odeset('RelTol',1e-9,'AbsTol',1e-11,'MaxStep',.001);
for n = 1:size(kc,1)
    k = kc(n,1); c = kc(n,2);
    % q(1) is displacement x; q(2) is velocity; both start at zero.
    rhs = @(tt,q) [q(2); ...
        (-c*(q(2)-rd(tt))-k*(q(1)-r(tt)))/m];
    [~,q] = ode45(rhs,t,[0;0],options);
    a = (-c*(q(:,2)-rd(t))-k*(q(:,1)-r(t)))/m;
    z = q(:,1)-r(t);
    peaks(n,:) = [max(abs(a))/g 1000*max(abs(z))];
    plot(ax2,t,a/g,'Color',colors(n,:),'LineStyle',lineStyles{n},'LineWidth',1.8);
    plot(ax3,t,1000*z,'Color',colors(n,:),'LineStyle',lineStyles{n},'LineWidth',1.8);
    file = sprintf('Project01_Case%s.csv',labels{n});
    writematrix([t r(t) q a z],fullfile(folder,file));
end
for ax = [ax1 ax2 ax3]
    grid(ax,'on'); xlim(ax,[0 3]);
    set(ax,'FontSize',15,'Color','w','XColor','k','YColor','k');
end
yline(ax2,.53,'k--'); yline(ax2,-.53,'k--');
yline(ax3,45,'k--'); yline(ax3,-45,'k--');
legend(ax2,names,'Location','northeast','TextColor','k','Color','w');
legend(ax3,names,'Location','northeast','TextColor','k','Color','w');
xlabel(tiles,'Time t (s)','Color','k');
set(findall(f,'Type','text'),'Color','k');
exportgraphics(f,fullfile(folder,'Project01_Response.png'), ...
    'Resolution',200);
results = table(names',compose('%.2f',peaks(:,1)), ...
    compose('%.1f',peaks(:,2)),'VariableNames', ...
    {'Candidate','PeakAcceleration_g','PeakTravel_mm'});
writetable(results,fullfile(folder,'Project01_Peaks.csv')); disp(results);
