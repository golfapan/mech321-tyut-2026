% MECH321 Tutorial 10 Q2 -- enter your own PI gains and complete the plots.
% Base MATLAB. States: temperature rise y (degC), integral command I (W).
Kp = NaN; Ki = NaN; % replace with your values from Q2(b)
assert(all(isfinite([Kp Ki])), 'Enter your gains from Q2(b).');
r = 12; t = (0:0.25:300)';
opt = odeset('RelTol',1e-8,'AbsTol',1e-10,'MaxStep',0.25);
[t,xLinear] = ode45(@(t,x) heaterPI(t,x,Kp,Ki,r,false),t,[0;0],opt);
[~,xLimited] = ode45(@(t,x) heaterPI(t,x,Kp,Ki,r,true),t,[0;0],opt);
yLinear = xLinear(:,1); yLimited = xLimited(:,1);
uLinear = Kp*(r-yLinear)+xLinear(:,2);
uLimited = min(5,max(0,Kp*(r-yLimited)+xLimited(:,2)));
% TODO: use subplot(2,1,1) and subplot(2,1,2) for temperature and power.
% Plot both cases; add labels, units, a legend and the 5 W limit.
% Check the initial slopes using the plant equation in Q2(c).

function dx = heaterPI(~,x,Kp,Ki,r,limited)
    e = r-x(1); request = Kp*e+x(2); power = request;
    rate = Ki*e;
    if limited
        power = min(5,max(0,request));
        if (request>=5 && e>0) || (request<=0 && e<0)
            rate = 0; % block only when the error deepens saturation
        end
    end
    dx = [(-x(1)+3*power)/45; rate];
end
